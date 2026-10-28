import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireOwner, requireSession } from '../middleware/auth.js';
import { disconnectSession, disconnectUser } from '../realtime.js';
import {
  appUrl, burnPasswordCheck, consumeEmailToken, createEmailToken, createRateLimiter, createSession,
  deleteSession, getSession, hashPassword, isConfiguredAdmin, loadUser, parseCookies, publicUser,
  SESSION_COOKIE, SESSION_TTL_MS, applyZeroPlan, verifyPassword, verifyZeroTicket,
} from '../services/auth.js';
import { planLimits, planRequired, usage } from '../services/plans.js';
import { emailEnabled, resetPasswordMessage, sendEmail, verifyEmailMessage, welcomeMessage } from '../services/email.js';
import {
  emailOnlySchema, loginSchema, memberSchema, passwordChangeSchema, passwordResetSchema, registerSchema,
  surveySchema, tokenSchema,
} from '../validation.js';

export const authRouter = Router();

const WINDOW = 15 * 60 * 1000;
const perEmail = createRateLimiter({ max: 8, windowMs: WINDOW });
const perIp = createRateLimiter({ max: 40, windowMs: WINDOW });
const signupsPerIp = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 });
const verifyResends = createRateLimiter({ max: 3, windowMs: WINDOW });
const resetsPerEmail = createRateLimiter({ max: 3, windowMs: 60 * 60 * 1000 });
const resetsPerIp = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 });

async function sendWelcome(req, user) {
  const base = appUrl(req);
  await sendEmail({
    to: user.email,
    ...welcomeMessage({
      name: user.name,
      appLink: `${base}/app`,
      videoUrl: `${base}/media/flowdesk-tour.mp4`,
      posterUrl: `${base}/email/welcome-video.jpg`,
    }),
  });
}

async function sendVerification(req, user) {
  const token = await createEmailToken(user.id, 'verify');
  await sendEmail({ to: user.email, ...verifyEmailMessage({ name: user.name, link: `${appUrl(req)}/verificar?token=${token}` }) });
}

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
        // ADMIN_EMAILS only counts once the inbox is proven, so nobody can claim an admin
        // address by registering it first. Without email delivery there is no proof to wait for.
        [ws.id, data.name, data.email, data.phone, data.job_title, passwordHash,
          !anyAdmin || (!emailEnabled && isConfiguredAdmin(data.email))],
      );
      return user.id;
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Inicia sesión.' });
    }
    throw err;
  }

  const user = await loadUser(userId);
  if (emailEnabled) {
    // The account exists either way; a failed send can be retried from the next screen.
    await sendVerification(req, user).catch((err) => console.error('[email] verification failed:', err.message));
  }
  const { token } = await createSession(userId);
  setSessionCookie(req, res, token);
  res.status(201).json({ user: publicUser(user) });
});

/**
 * Single sign-on from zerosolutions.cl: the ZERO account page redirects here with a signed,
 * single-use ticket. Links to the FlowDesk account with the same (ZERO-confirmed) email, or
 * creates one with its own workspace.
 */
authRouter.get('/auth/zero', async (req, res) => {
  const fail = (reason) => res.redirect(302, `/login?zero=${reason}`);
  const { claims, error } = verifyZeroTicket(req.query.ticket);
  if (!claims) return fail(error);
  const parsed = emailOnlySchema.safeParse({ email: claims.email });
  if (!parsed.success) return fail('invalid');
  const { email } = parsed.data;

  const { rowCount } = await query(
    'INSERT INTO zero_sso_nonces (nonce, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT DO NOTHING',
    [claims.nonce, claims.exp],
  );
  if (!rowCount) return fail('used');
  query('DELETE FROM zero_sso_nonces WHERE expires_at < now()').catch(() => {});

  const { rows: [existing] } = await query('SELECT id, banned_at FROM users WHERE email = $1', [email]);
  if (existing?.banned_at) return fail('suspended');

  let userId = existing?.id;
  if (userId) {
    await query(
      `UPDATE users SET last_login_at = now(), email_verified_at = coalesce(email_verified_at, now()),
              is_admin = is_admin OR $2 WHERE id = $1`,
      [userId, isConfiguredAdmin(email)],
    );
  } else {
    const name = String(claims.name ?? '').trim().slice(0, 120) || email.split('@')[0];
    // Random password: the account signs in through ZERO (or "forgot password" to set one).
    const passwordHash = await hashPassword(randomUUID());
    userId = await withTransaction(async (db) => {
      const { rows: [ws] } = await db.query('INSERT INTO workspaces (name) VALUES ($1) RETURNING id', [
        workspaceNameFor(name, email),
      ]);
      const { rows: [{ any_admin: anyAdmin }] } = await db.query(
        'SELECT EXISTS (SELECT 1 FROM users WHERE is_admin) AS any_admin',
      );
      const { rows: [user] } = await db.query(
        `INSERT INTO users (workspace_id, name, email, password_hash, role, is_admin, email_verified_at, last_login_at)
         VALUES ($1, $2, $3, $4, 'owner', $5, now(), now()) RETURNING id`,
        [ws.id, name, email, passwordHash, !anyAdmin || isConfiguredAdmin(email)],
      );
      return user.id;
    });
    if (emailEnabled) {
      await sendWelcome(req, { name, email }).catch((err) => console.error('[email] welcome failed:', err.message));
    }
  }

  // The ticket also carries the plan paid at ZERO, so FlowDesk catches up even if ZERO's push failed.
  if (claims.plan) {
    await withTransaction(async (db) => {
      const { rows: [u] } = await db.query('SELECT workspace_id FROM users WHERE id = $1', [userId]);
      await applyZeroPlan(db, u.workspace_id, claims.plan);
    }).catch((err) => console.error('[zero] plan from ticket failed:', err.message));
  }

  const { token } = await createSession(userId);
  setSessionCookie(req, res, token);
  res.redirect(302, '/app');
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
  const verified = Boolean(user.email_verified_at) || !emailEnabled;
  await query(
    `UPDATE users SET last_login_at = now(), is_admin = is_admin OR $2 WHERE id = $1`,
    [user.id, verified && isConfiguredAdmin(user.email)],
  );
  const { token } = await createSession(user.id);
  setSessionCookie(req, res, token);
  res.json({ user: publicUser(await loadUser(user.id)) });
});

authRouter.post('/auth/logout', requireSession, async (req, res) => {
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

// ---- Email verification & password reset -----------------------------------

authRouter.post('/auth/verify', async (req, res) => {
  const { token } = tokenSchema.parse(req.body);
  const userId = await consumeEmailToken(token, 'verify');
  if (!userId) {
    return res.status(400).json({ error: 'El enlace no es válido o ya expiró. Pide uno nuevo desde FlowDesk.' });
  }
  const { rows: [user] } = await query(
    `UPDATE users u SET email_verified_at = coalesce(old.email_verified_at, now())
       FROM users old WHERE u.id = $1 AND old.id = u.id
     RETURNING u.name, u.email, u.role, old.email_verified_at IS NULL AS first_time`,
    [userId],
  );
  if (isConfiguredAdmin(user.email)) await query('UPDATE users SET is_admin = true WHERE id = $1', [userId]);
  // The welcome email (with the tour video attached) waits for a proven inbox, so a typo'd or
  // someone else's address never receives a video attachment. Awaited: serverless freezes on reply.
  if (user.first_time && user.role === 'owner') {
    await sendWelcome(req, user).catch((err) => console.error('[email] welcome failed:', err.message));
  }
  res.json({ ok: true });
});

authRouter.post('/auth/verify/resend', requireSession, async (req, res) => {
  if (!emailEnabled) return res.status(400).json({ error: 'El envío de correos no está configurado.' });
  if (req.user.email_verified_at) return res.json({ ok: true, alreadyVerified: true });
  const wait = verifyResends.hit(String(req.user.id));
  if (wait) return retryLater(res, wait);
  await sendVerification(req, req.user);
  res.json({ ok: true });
});

/** Always answers the same way so it can't be used to discover which emails have accounts. */
authRouter.post('/auth/forgot', async (req, res) => {
  const { email } = emailOnlySchema.parse(req.body);
  if (!emailEnabled) {
    return res.status(503).json({
      error: 'El envío de correos no está configurado. Pide a un administrador que restablezca tu contraseña.',
    });
  }
  const wait = Math.max(resetsPerIp.hit(req.ip), resetsPerEmail.hit(email));
  if (wait) return retryLater(res, wait);

  const { rows: [user] } = await query('SELECT id, name, email FROM users WHERE email = $1 AND banned_at IS NULL', [email]);
  if (user) {
    const token = await createEmailToken(user.id, 'reset');
    await sendEmail({
      to: user.email,
      ...resetPasswordMessage({ name: user.name, link: `${appUrl(req)}/restablecer?token=${token}` }),
    }).catch((err) => console.error('[email] reset failed:', err.message));
  }
  res.json({ ok: true });
});

authRouter.post('/auth/reset', async (req, res) => {
  const { token, password } = passwordResetSchema.parse(req.body);
  const passwordHash = await hashPassword(password);
  const userId = await withTransaction(async (db) => {
    const id = await consumeEmailToken(token, 'reset', db);
    if (!id) return null;
    // Following the link proves the inbox, so it also confirms the email.
    await db.query(
      'UPDATE users SET password_hash = $2, email_verified_at = coalesce(email_verified_at, now()) WHERE id = $1',
      [id, passwordHash],
    );
    await db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    return id;
  });
  if (!userId) {
    return res.status(400).json({ error: 'El enlace no es válido o ya expiró. Pide uno nuevo.' });
  }
  disconnectUser(userId);
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

/** The welcome video popup was closed; it only shows once per account. */
authRouter.post('/auth/welcome', requireAuth, async (req, res) => {
  await query('UPDATE users SET welcome_seen_at = coalesce(welcome_seen_at, now()) WHERE id = $1', [req.user.id]);
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
  const [{ users: max }, { users }] = await Promise.all([planLimits(req.user.workspace_id), usage(req.user.workspace_id)]);
  if (users >= max) {
    throw planRequired(max === 1
      ? 'El plan Gratis es para 1 usuario. Con FlowDesk Pro suma hasta 3 personas a tu equipo.'
      : `Tu plan permite hasta ${max} usuarios.${max < 15 ? ' Con FlowDesk Max son hasta 15.' : ''}`);
  }
  try {
    const { rows: [user] } = await query(
      `INSERT INTO users (workspace_id, name, email, password_hash, role, email_verified_at)
       VALUES ($1, $2, $3, $4, 'member', now()) RETURNING id`,
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
