import { getSession, parseCookies, SESSION_COOKIE } from '../services/auth.js';

export async function requireAuth(req, res, next) {
  const session = await getSession(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
  if (!session) return res.status(401).json({ error: 'Sesión no válida o expirada' });
  req.user = session.user;
  req.sessionId = session.sessionId;
  next();
}

export function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Solo el propietario puede hacer esto' });
  }
  next();
}
