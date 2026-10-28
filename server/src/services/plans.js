import { query } from '../db.js';

/**
 * What each tier allows, mirroring the plan cards on zerosolutions.cl/precios (null = no limit).
 * Nothing is ever deleted when a plan ends: past a limit you just can't add more.
 */
export const PLAN_LIMITS = {
  free: { users: 1, leads: 100, csv: false, webhook: false, whatsapp_template: false },
  pro: { users: 3, leads: null, csv: true, webhook: true, whatsapp_template: true },
  max: { users: 15, leads: null, csv: true, webhook: true, whatsapp_template: true },
};

export const DEFAULT_WHATSAPP_TEMPLATE = 'Hola {nombre}, te escribo de {empresa}. ¿Tienes unos minutos para conversar?';

/** The tier a workspace has right now: an expired paid plan counts as 'free'. */
export async function workspacePlan(ws, db = { query }) {
  const { rows: [row] } = await db.query(
    `SELECT CASE WHEN plan <> 'free' AND (plan_expires_at IS NULL OR plan_expires_at > now()) THEN plan ELSE 'free' END
         AS plan
       FROM workspaces WHERE id = $1`,
    [ws],
  );
  return row?.plan ?? 'free';
}

export const planLimits = async (ws, db) => PLAN_LIMITS[await workspacePlan(ws, db)];

/** 402 with a code the client turns into a "Mejorar plan" prompt. */
export function planRequired(message) {
  const err = new Error(message);
  err.status = 402;
  err.code = 'PLAN_REQUIRED';
  return err;
}

export async function usage(ws) {
  const { rows: [row] } = await query(
    `SELECT (SELECT count(*)::int FROM leads WHERE workspace_id = $1) AS leads,
            (SELECT count(*)::int FROM users WHERE workspace_id = $1) AS users`,
    [ws],
  );
  return row;
}

/** Throws when the plan has no room for `adding` more leads. */
export async function assertLeadRoom(ws, adding = 1) {
  const { leads: max } = await planLimits(ws);
  if (max === null) return;
  const { leads } = await usage(ws);
  if (leads + adding > max) {
    throw planRequired(`El plan Gratis permite hasta ${max} leads. Con FlowDesk Pro son ilimitados.`);
  }
}
