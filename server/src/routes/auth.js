import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { disconnectSession, disconnectUser } from '../realtime.js';
import {
  burnPasswordCheck, createRateLimiter, createSession, deleteSession, getSession, hashPassword,
  parseCookies, publicUser, SESSION_COOKIE, SESSION_TTL_MS, verifyPassword,
} from '../services/auth.js';
import { loginSchema, passwordChangeSchema, registerSchema } from '../validation.js';

export const authRouter = Router();

const WINDOW = 15 * 60 * 1000;
const perEmail = createRateLimiter({ max: 8, windowMs: WINDOW });
const perIp = createRateLimiter({ max: 40, windowMs: WINDOW });

function setSessionCookie(req, res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure || process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

async function hasUsers() {
  const { rows: [{ exists }] } = await query('SELECT EXISTS (SELECT 1 FROM users) AS exists');
  return exists;
}

// Public: lets the landing and login screens know whether first-run setup is pending.
authRouter.get('/auth/status', async (_req, res) => {
  res.json({ setupRequired: !(await hasUsers()) });
});

/**
 * Creates the workspace owner. Open only while there are no users; teammates are
 * added afterwards by the owner from Settings, so strangers can't sign up and read leads.
 */
authRouter.post('/auth/register', async (req, res) => {
  const data = registerSchema.parse(req.body);
  const passwordHash = await hashPassword(data.password);

  const user = await withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(4242)'); // serialize concurrent first sign-ups
    const { rows: [{ count }] } = await db.query('SELECT count(*)::int AS count FROM users');
    if (count > 0) return null;
    const { rows: [created] } = await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'owner') RETURNING *`,
      [data.name, data.email, passwordHash],
    );
    return created;
  });
  if (!user) {
    return res.status(403).json({ error: 'El registro está cerrado. Pide acceso al propietario del espacio.' });
  }

  const { token } = await createSession(user.id);
  setSessionCookie(req, res, token);
  res.status(201).json({ user: publicUser(user) });
});

authRouter.post('/auth/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const wait = Math.max(perIp.hit(req.ip), perEmail.hit(email));
  if (wait) {
    res.set('Retry-After', String(wait));
    return res.status(429).json({ error: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(wait / 60)} min.` });
  }

  const { rows: [user] } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const ok = user ? await verifyPassword(password, user.password_hash) : await burnPasswordCheck(password);
  if (!user || !ok) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  perEmail.reset(email);
  const { token } = await createSession(user.id);
  setSessionCookie(req, res, token);
  res.json({ user: publicUser(user) });
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

// ---- Team (owner-managed accounts) -----------------------------------------

export const usersRouter = Router();

usersRouter.get('/users', async (_req, res) => {
  const { rows } = await query('SELECT * FROM users ORDER BY created_at, id');
  res.json(rows.map(publicUser));
});

usersRouter.post('/users', requireOwner, async (req, res) => {
  const data = registerSchema.parse(req.body);
  try {
    const { rows: [user] } = await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'member') RETURNING *`,
      [data.name, data.email, await hashPassword(data.password)],
    );
    res.status(201).json(publicUser(user));
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    throw err;
  }
});

usersRouter.delete('/users/:id', requireOwner, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  const { rowCount } = await query(`DELETE FROM users WHERE id = $1 AND role <> 'owner'`, [id]);
  if (!rowCount) return res.status(404).json({ error: 'Miembro no encontrado' });
  disconnectUser(id);
  res.status(204).end();
});
