import { getSession, parseCookies, SESSION_COOKIE } from '../services/auth.js';
import { emailEnabled } from '../services/email.js';

/** Any signed-in user, verified or not (logout, resending the verification email). */
export async function requireSession(req, res, next) {
  const session = await getSession(parseCookies(req.headers.cookie)[SESSION_COOKIE]);
  if (!session) return res.status(401).json({ error: 'Sesión no válida o expirada' });
  req.user = session.user;
  req.sessionId = session.sessionId;
  next();
}

/** Signed-in user with a confirmed email (when email delivery is configured). */
export async function requireAuth(req, res, next) {
  await requireSession(req, res, () => {
    if (emailEnabled && !req.user.email_verified_at) {
      return res.status(403).json({ code: 'EMAIL_NOT_VERIFIED', error: 'Confirma tu correo para continuar' });
    }
    next();
  });
}

export function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Solo el propietario puede hacer esto' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Solo administradores de FlowDesk' });
  }
  next();
}
