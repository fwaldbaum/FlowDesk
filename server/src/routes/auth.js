import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { disconnectSession, disconnectUser } from '../realtime.js';
import {
  burnPasswordCheck, createRateLimiter, createSession, deleteSession, getSession, hashPassword,
  isConfiguredAdmin, loadUser, parseCookies, publicUser, SESSION_COOKIE, SESSION_TTL_MS,
  verifyPassword,
} from '../services/auth.js';
import {
  loginSchema, memberSchema, passwordChangeSchema, registerSchema, surveySchema,
} from '../validation.js';

export const authRouter = Router();

const WINDOW = 15 * 60 * 1000;
const perEmail = createRateLimiter({ max: 8, windowMs: WINDOW });
const perIp = createRateLimiter({ max: 40, windowMs: WINDOW });
const signupsPerIp = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 });

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com',
  'msn.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com', 'proton.me',
  'gmx.com',
]);

/** "acme.cl" for company emails, "Espacio de Ana" for personal ones. */
function workspaceNameFor(name, email) {
  const domain = email.split('@')[1];
  return FREE_EMAIL_DOMAINS.has(domain) ? `Espacio de ${name.split(' ')[0]}` : domain;
}

function setSessionCookie(req, res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure || process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

const retryLater = (res, seconds) => {
  res.set('Retry-After', String(seconds));
  return res
    .status(429)
    .json({ error: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(seconds / 60)} min.` });
};

/** Self-service sign-up: every new account gets its own isolated workspace. */
authRouter.post('/auth/register', async (req, res) => {
  const data = registerSchema.parse(req.body);
  const wait = signupsPerIp.hit(req.ip);
  if (wait) return retryLater(res, wait);

  const passwordHash = await hashPassword(data.password);
  let userId;
  try {
    userId = await withTransaction(async (db) => {
      const { rows: [ws] } = await db.query('INSERT INTO workspaces (name) VALUES ($1) RETURNING id', [
        workspaceNameFor(data.name, data.email),
      ]);
      // The very first account on a fresh install runs the platform.
      const { rows: [{ any_admin: anyAdmin }] } = await db.query(
        'SELECT EXISTS (SELECT 1 FROM users WHERE is_admin) AS any_admin',
      );
      const { rows: [user] } = await db.query(
        `INSERT INTO users (workspace_id, name, email, phone, job_title, password_hash, role, is_admin, last_login_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'owner', $7, now()) RETURNING id`,
        [ws.id, data.name, data.email, data.phone, data.job_title, passwordHash,
          !anyAdmin || isConfiguredAdmin(data.email)],
      );
      return user.id;
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Inicia sesión.' });
    }
    throw err;
  }

  const { token } = await createSession(userId);
  setSessionCookie(req, res, token);
  res.status(201).json({ user: publicUser(await loadUser(userId)) });
});

authRouter.post('/auth/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const wait = Math.max(perIp.hit(req.ip), perEmail.hit(email));
  if (wait) return retryLater(res, wait);

  const { rows: [user] } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const ok = user ? await verifyPassword(password, user.password_hash) : await burnPasswordCheck(password);
  if (!user || !ok) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
  // Only reveal the suspension after a correct password, so it can't be probed.
  if (user.banned_at) {
    return res.status(403).json({
      error: user.ban_reason
        ? `Tu cuenta está suspendida: ${user.ban_reason}`
        : 'Tu cuenta está suspendida. Contacta al soporte de FlowDesk.',
    });
  }

  perEmail.reset(email);
  await query(
    `UPDATE users SET last_login_at = now(), is_admin = is_admin OR $2 WHERE id = $1`,
    [user.id, isConfiguredAdmin(user.email)],
  );
  const { token } = await createSession(user.id);
  setSessionCookie(req, res, token);
  res.json({ user: publicUser(await loadUser(user.id)) });
});

authRouter.post('/auth/logout', requireAuth, async (req, res) => {
  await deleteSession(req.sessionId);
  disconnectSession(req.sessionId);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.status(204).end();
});

// Answers 200 for anonymous visitors too, so the public landing page doesn't log 401s.
authRouter.get('/auth/me', async (req, res) => {
  const session = await getSession(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
  res.json({ user: session ? publicUser(session.user) : null });
});

authRouter.post('/auth/password', requireAuth, async (req, res) => {
  const { current, next } = passwordChangeSchema.parse(req.body);
  const { rows: [user] } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!(await verifyPassword(current, user.password_hash))) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta' });
  }
  await query('UPDATE users SET password_hash = $2 WHERE id = $1', [req.user.id, await hashPassword(next)]);
  // Sign out every other device; keep the current session.
  const { rows } = await query(
    'DELETE FROM sessions WHERE user_id = $1 AND id <> $2 RETURNING id',
    [req.user.id, req.sessionId],
  );
  rows.forEach((r) => disconnectSession(r.id));
  res.status(204).end();
});

/** Post-signup survey. Answering again overwrites the previous answers. */
authRouter.post('/auth/onboarding', requireAuth, async (req, res) => {
  const data = surveySchema.parse(req.body);
  await query(
    `INSERT INTO survey_responses (user_id, heard_from, heard_from_detail, company_size, company_about)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
       SET heard_from = EXCLUDED.heard_from, heard_from_detail = EXCLUDED.heard_from_detail,
           company_size = EXCLUDED.company_size, company_about = EXCLUDED.company_about`,
    [req.user.id, data.heard_from, data.heard_from === 'other' ? data.heard_from_detail : null,
      data.company_size, data.company_about],
  );
  res.json({ user: publicUser(await loadUser(req.user.id)) });
});

// ---- Team (owner-managed accounts inside one workspace) -------------------

export const usersRouter = Router();

usersRouter.get('/users', async (req, res) => {
  const { rows } = await query(
    `SELECT u.*, w.name AS workspace_name FROM users u JOIN workspaces w ON w.id = u.workspace_id
      WHERE u.workspace_id = $1 ORDER BY u.created_at, u.id`,
    [req.user.workspace_id],
  );
  res.json(rows.map(publicUser));
});

usersRouter.post('/users', requireOwner, async (req, res) => {
  const data = memberSchema.parse(req.body);
  try {
    const { rows: [user] } = await query(
      `INSERT INTO users (workspace_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'member') RETURNING id`,
      [req.user.workspace_id, data.name, data.email, await hashPassword(data.password)],
    );
    res.status(201).json(publicUser(await loadUser(user.id)));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    throw err;
  }
});

usersRouter.delete('/users/:id', requireOwner, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  const { rowCount } = await query(
    `DELETE FROM users WHERE id = $1 AND workspace_id = $2 AND role <> 'owner'`,
    [id, req.user.workspace_id],
  );
  if (!rowCount) return res.status(404).json({ error: 'Miembro no encontrado' });
  disconnectUser(id);
  res.status(204).end();
});
