import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { query } from '../db.js';
import { emailEnabled } from './email.js';

const scrypt = promisify(scryptCb);

export const SESSION_COOKIE = 'fd_session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64url'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Verified against when the email doesn't exist so response time doesn't reveal accounts.
const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'));
export const burnPasswordCheck = (password) => verifyPassword(password, DUMMY_HASH);

const sha256 = (token) => createHash('sha256').update(token).digest('hex');

export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const { rows: [session] } = await query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3) RETURNING id',
    [sha256(token), userId, expiresAt],
  );
  // Opportunistic cleanup keeps the table small without a cron job.
  query('DELETE FROM sessions WHERE expires_at < now()').catch(() => {});
  return { token, sessionId: session.id, expiresAt };
}

/** Columns behind publicUser(); `u` is users, `w` is workspaces. */
export const USER_SELECT = `
  u.id, u.name, u.email, u.phone, u.job_title, u.role, u.is_admin, u.workspace_id, u.created_at,
  u.email_verified_at,
  w.name AS workspace_name,
  (u.role = 'owner' AND NOT EXISTS (SELECT 1 FROM survey_responses sr WHERE sr.user_id = u.id))
    AS needs_onboarding`;

/** Resolve a raw cookie token to { sessionId, user } or null. Suspended users have no session. */
export async function getSession(token) {
  if (!token) return null;
  const { rows: [row] } = await query(
    `SELECT s.id AS session_id, ${USER_SELECT}
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN workspaces w ON w.id = u.workspace_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.banned_at IS NULL`,
    [sha256(token)],
  );
  if (!row) return null;
  const { session_id: sessionId, ...user } = row;
  return { sessionId, user };
}

export async function loadUser(id) {
  const { rows: [row] } = await query(
    `SELECT ${USER_SELECT} FROM users u JOIN workspaces w ON w.id = u.workspace_id WHERE u.id = $1`,
    [id],
  );
  return row ?? null;
}

export async function deleteSession(sessionId) {
  await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const key = part.slice(0, i).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      // Ignore malformed values rather than failing the whole request.
    }
  }
  return out;
}

export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone ?? null,
  job_title: u.job_title ?? null,
  role: u.role,
  is_admin: Boolean(u.is_admin),
  workspace_id: u.workspace_id,
  workspace_name: u.workspace_name ?? null,
  email_verified: Boolean(u.email_verified_at),
  // Verification is only enforced when the server can actually send email.
  needs_verification: emailEnabled && !u.email_verified_at,
  needs_onboarding: Boolean(u.needs_onboarding),
  created_at: u.created_at,
});

/** Emails listed in ADMIN_EMAILS are always platform admins. */
export const isConfiguredAdmin = (email) =>
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());

/** Fixed-window limiter, in memory. Good enough for a single-process deployment. */
export function createRateLimiter({ max, windowMs }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset < now) hits.delete(key);
  }, windowMs).unref();

  return {
    /** Returns seconds to wait when the key is over the limit, otherwise 0. */
    hit(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.reset < now) {
        entry = { count: 0, reset: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count > max ? Math.ceil((entry.reset - now) / 1000) : 0;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

// ---- Single-use email tokens (verification, password reset) ----------------

const TOKEN_TTL = { verify: 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 };

/** Issues a new token and invalidates older unused ones for the same purpose. */
export async function createEmailToken(userId, purpose) {
  await query(
    'UPDATE email_tokens SET used_at = now() WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL',
    [userId, purpose],
  );
  const token = randomBytes(32).toString('base64url');
  await query(
    'INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, purpose, sha256(token), new Date(Date.now() + TOKEN_TTL[purpose])],
  );
  return token;
}

/** Marks a valid token as used and returns its user id, or null if invalid/expired/used. */
export async function consumeEmailToken(token, purpose, db = { query }) {
  if (typeof token !== 'string' || token.length < 20) return null;
  const { rows: [row] } = await db.query(
    `UPDATE email_tokens SET used_at = now()
      WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
      RETURNING user_id`,
    [sha256(token), purpose],
  );
  return row?.user_id ?? null;
}

/** Public base URL for links in emails. */
export function appUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.get('x-forwarded-host') ?? req.get('host');
  return `${req.protocol}://${host}`;
}
