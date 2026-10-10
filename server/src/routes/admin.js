import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { disconnectUser, disconnectWorkspace } from '../realtime.js';
import { appUrl, hashPassword } from '../services/auth.js';
import { emailEnabled, emailProvider, sendEmail, testEmailMessage } from '../services/email.js';
import {
  adminFlagSchema, adminPasswordSchema, adminUserUpdateSchema, banSchema, COMPANY_SIZES, HEARD_FROM,
} from '../validation.js';

/** Platform administration: every account across every workspace. */
export const adminRouter = Router();
adminRouter.use('/admin', requireAdmin);

const ADMIN_USER_SELECT = `
  SELECT u.id, u.name, u.email, u.phone, u.job_title, u.role, u.is_admin, u.banned_at, u.ban_reason,
         u.created_at, u.last_login_at, u.email_verified_at,
         w.id AS workspace_id, w.name AS workspace_name,
         sr.heard_from, sr.heard_from_detail, sr.company_size, sr.company_about,
         sr.created_at AS survey_at,
         (SELECT count(*) FROM leads l WHERE l.workspace_id = w.id)::int AS leads_count,
         (SELECT count(*) FROM users m WHERE m.workspace_id = w.id)::int AS members_count,
         (SELECT count(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > now())::int
           AS active_sessions
    FROM users u
    JOIN workspaces w ON w.id = u.workspace_id
    LEFT JOIN survey_responses sr ON sr.user_id = u.id`;

const FILTERS = {
  all: 'true',
  active: 'u.banned_at IS NULL',
  banned: 'u.banned_at IS NOT NULL',
  admins: 'u.is_admin',
  unverified: 'u.email_verified_at IS NULL',
};

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function targetId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('ID inválido');
    err.status = 400;
    throw err;
  }
  return id;
}

/** Guards actions an admin must not take on their own account (lock-out, self-deletion). */
function notSelf(req, res, id, message) {
  if (id !== req.user.id) return true;
  res.status(400).json({ error: message });
  return false;
}

async function getAdminUser(id) {
  const { rows: [user] } = await query(`${ADMIN_USER_SELECT} WHERE u.id = $1`, [id]);
  return user ?? null;
}

async function logAction(req, target, action, details = null) {
  await query(
    `INSERT INTO admin_actions (admin_id, admin_email, target_user_id, target_email, action, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user.id, req.user.email, target.id, target.email, action, details],
  );
}

async function revokeSessions(userId) {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  disconnectUser(userId);
}

adminRouter.get('/admin/stats', async (_req, res) => {
  const { rows: [totals] } = await query(`
    SELECT (SELECT count(*) FROM users)::int AS users,
           (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days')::int AS new_7d,
           (SELECT count(*) FROM users WHERE banned_at IS NOT NULL)::int AS banned,
           (SELECT count(*) FROM workspaces)::int AS workspaces,
           (SELECT count(*) FROM leads)::int AS leads,
           (SELECT count(*) FROM survey_responses)::int AS surveys`);
  const breakdown = async (column, keys) => {
    const { rows } = await query(
      `SELECT ${column} AS key, count(*)::int AS count FROM survey_responses GROUP BY 1`,
    );
    const counts = Object.fromEntries(rows.map((r) => [r.key, r.count]));
    return keys.map((key) => ({ key, count: counts[key] ?? 0 }));
  };
  res.json({
    ...totals,
    email_enabled: emailEnabled,
    email_provider: emailProvider,
    heard_from: await breakdown('heard_from', HEARD_FROM),
    company_size: await breakdown('company_size', COMPANY_SIZES),
  });
});

/** Sends a test email to the admin's own address and reports the provider's error verbatim. */
adminRouter.post('/admin/email/test', async (req, res) => {
  if (!emailEnabled) return res.status(400).json({ error: 'No hay un proveedor de correo configurado.' });
  try {
    await sendEmail({ to: req.user.email, ...testEmailMessage({ name: req.user.name, link: `${appUrl(req)}/app` }) });
    res.json({ ok: true, to: req.user.email });
  } catch (err) {
    console.error('[email] test failed:', err.message);
    res.status(502).json({ error: `No se pudo enviar: ${err.message}` });
  }
});

adminRouter.get('/admin/users', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const filter = FILTERS[req.query.filter] ?? FILTERS.all;
  const { rows } = await query(
    `${ADMIN_USER_SELECT}
      WHERE ${filter}
        AND ($1 = '' OR u.name ILIKE $2 OR u.email ILIKE $2 OR u.phone ILIKE $2 OR w.name ILIKE $2)
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT 500`,
    [q, `%${escapeLike(q)}%`],
  );
  res.json(rows);
});

adminRouter.get('/admin/users/:id', async (req, res) => {
  const user = await getAdminUser(targetId(req));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { rows: actions } = await query(
    `SELECT id, admin_email, action, details, created_at FROM admin_actions
      WHERE target_user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [user.id],
  );
  res.json({ ...user, actions });
});

adminRouter.patch('/admin/users/:id', async (req, res) => {
  const id = targetId(req);
  const patch = adminUserUpdateSchema.parse(req.body);
  const before = await getAdminUser(id);
  if (!before) return res.status(404).json({ error: 'Usuario no encontrado' });

  const fields = ['name', 'email', 'phone', 'job_title'].filter(
    (k) => k in patch && (patch[k] || null) !== (before[k] || null),
  );
  if (fields.length === 0) return res.json(before);

  try {
    await query(
      `UPDATE users SET ${fields.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1`,
      [id, ...fields.map((k) => patch[k] || null)],
    );
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ese correo ya pertenece a otra cuenta' });
    throw err;
  }
  const changes = Object.fromEntries(fields.map((k) => [k, { from: before[k], to: patch[k] || null }]));
  await logAction(req, { id, email: patch.email ?? before.email }, 'update', changes);
  res.json(await getAdminUser(id));
});

adminRouter.post('/admin/users/:id/ban', async (req, res) => {
  const id = targetId(req);
  if (!notSelf(req, res, id, 'No puedes suspender tu propia cuenta')) return;
  const { reason } = banSchema.parse(req.body ?? {});
  const { rows: [user] } = await query(
    'UPDATE users SET banned_at = now(), ban_reason = $2 WHERE id = $1 RETURNING id, email',
    [id, reason || null],
  );
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await revokeSessions(id);
  await logAction(req, user, 'ban', reason ? { reason } : null);
  res.json(await getAdminUser(id));
});

adminRouter.post('/admin/users/:id/unban', async (req, res) => {
  const id = targetId(req);
  const { rows: [user] } = await query(
    'UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = $1 RETURNING id, email',
    [id],
  );
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await logAction(req, user, 'unban');
  res.json(await getAdminUser(id));
});

adminRouter.post('/admin/users/:id/password', async (req, res) => {
  const id = targetId(req);
  const { password } = adminPasswordSchema.parse(req.body);
  const { rows: [user] } = await query(
    'UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id, email',
    [id, await hashPassword(password)],
  );
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await revokeSessions(id);
  await logAction(req, user, 'password_reset');
  res.json(await getAdminUser(id));
});

adminRouter.post('/admin/users/:id/verify', async (req, res) => {
  const id = targetId(req);
  const { rows: [user] } = await query(
    'UPDATE users SET email_verified_at = coalesce(email_verified_at, now()) WHERE id = $1 RETURNING id, email',
    [id],
  );
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await logAction(req, user, 'verify_email');
  res.json(await getAdminUser(id));
});

adminRouter.post('/admin/users/:id/logout', async (req, res) => {
  const id = targetId(req);
  const user = await getAdminUser(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await revokeSessions(id);
  await logAction(req, user, 'logout');
  res.json(await getAdminUser(id));
});

adminRouter.post('/admin/users/:id/admin', async (req, res) => {
  const id = targetId(req);
  const { is_admin: isAdmin } = adminFlagSchema.parse(req.body);
  if (!isAdmin && !notSelf(req, res, id, 'No puedes quitarte tus propios permisos de administrador')) return;
  const { rows: [user] } = await query(
    'UPDATE users SET is_admin = $2 WHERE id = $1 RETURNING id, email',
    [id, isAdmin],
  );
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await logAction(req, user, isAdmin ? 'grant_admin' : 'revoke_admin');
  res.json(await getAdminUser(id));
});

/**
 * Deleting a workspace owner deletes the whole workspace (its leads and members),
 * since a workspace can't exist without its owner. Members are deleted alone.
 */
adminRouter.delete('/admin/users/:id', async (req, res) => {
  const id = targetId(req);
  if (!notSelf(req, res, id, 'No puedes eliminar tu propia cuenta desde el panel')) return;
  const user = await getAdminUser(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const deletesWorkspace = user.role === 'owner';
  if (deletesWorkspace && user.workspace_id === req.user.workspace_id) {
    return res.status(400).json({ error: 'Es el propietario de tu propio espacio: eliminarlo te borraría a ti también' });
  }
  await logAction(req, user, 'delete', {
    workspace: user.workspace_name,
    deleted_workspace: deletesWorkspace,
    leads: deletesWorkspace ? user.leads_count : 0,
    members: deletesWorkspace ? user.members_count : 1,
  });
  await withTransaction(async (db) => {
    if (deletesWorkspace) await db.query('DELETE FROM workspaces WHERE id = $1', [user.workspace_id]);
    else await db.query('DELETE FROM users WHERE id = $1', [id]);
  });
  if (deletesWorkspace) disconnectWorkspace(user.workspace_id);
  else disconnectUser(id);
  res.json({ deleted: true, deleted_workspace: deletesWorkspace });
});
