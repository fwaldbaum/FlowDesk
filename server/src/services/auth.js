import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { query } from '../db.js';

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

/** Resolve a raw cookie token to { sessionId, user } or null. */
export async function getSession(token) {
  if (!token) return null;
  const { rows: [row] } = await query(
    `SELECT s.id AS session_id, u.id, u.name, u.email, u.role, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha256(token)],
  );
  if (!row) return null;
  const { session_id: sessionId, ...user } = row;
  return { sessionId, user };
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

export const publicUser = ({ id, name, email, role, created_at }) => ({ id, name, email, role, created_at });

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
