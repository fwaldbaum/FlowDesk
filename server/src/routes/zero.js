import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { applyZeroPlan, verifyZeroSignature } from '../services/auth.js';

export const zeroRouter = Router();

/**
 * zerosolutions.cl tells FlowDesk about a paid plan right after a Flow payment. The body is signed with
 * ZERO_SSO_SECRET. The plan goes to the workspace of the account with that email; if there is none yet,
 * the same plan arrives in the sign-in ticket the first time the person opens FlowDesk from ZERO.
 */
zeroRouter.post('/zero/plan', async (req, res) => {
  if (!verifyZeroSignature(req.rawBody, req.get('x-zero-signature'))) {
    return res.status(401).json({ error: 'Firma no válida' });
  }
  const { app, email, tier, exp, iat } = req.body ?? {};
  const now = Math.floor(Date.now() / 1000);
  if (app !== 'flowdesk' || typeof email !== 'string' || !Number.isInteger(iat) || Math.abs(now - iat) > 300) {
    return res.status(422).json({ error: 'Datos inválidos' });
  }
  const { rows: [user] } = await query('SELECT workspace_id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
  if (!user) return res.json({ ok: true, found: false, applied: false });
  const applied = await withTransaction((db) => applyZeroPlan(db, user.workspace_id, { tier, exp }));
  res.json({ ok: true, found: true, applied });
});
