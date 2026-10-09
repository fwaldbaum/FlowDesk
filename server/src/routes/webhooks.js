import { Router } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { query } from '../db.js';
import { requireOwner } from '../middleware/auth.js';
import { createLead } from '../services/leads.js';
import { formatZodError, webhookLeadSchema } from '../validation.js';

/** Public: third parties post leads here; the workspace is identified by its webhook key. */
export const publicWebhooksRouter = Router();
/** Session-protected helpers used by the Settings screen. */
export const webhooksRouter = Router();

async function logEvent({ workspaceId = null, status, leadId = null, payload, error = null, ip }) {
  await query(
    `INSERT INTO webhook_events (workspace_id, status, lead_id, payload, error, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [workspaceId, status, leadId, payload ?? null, error, ip ?? null],
  ).catch((err) => console.error('[webhook] could not log event:', err.message));
}

async function ingest(req, res, workspaceId, payload) {
  try {
    const data = webhookLeadSchema.parse(payload);
    const lead = await createLead(workspaceId, data, { origin: 'webhook' });
    await logEvent({ workspaceId, status: 'accepted', leadId: lead.id, payload, ip: req.ip });
    res.status(201).json({ ok: true, lead });
  } catch (err) {
    if (!(err instanceof ZodError)) throw err;
    const details = formatZodError(err);
    await logEvent({
      workspaceId,
      status: 'rejected',
      payload,
      error: details.map((d) => d.message).join('; '),
      ip: req.ip,
    });
    res.status(422).json({ ok: false, error: 'Payload inválido', details });
  }
}

// Public ingestion endpoint: callable from forms, Zapier, Make, n8n, etc.
publicWebhooksRouter.options('/webhooks/lead', cors());
publicWebhooksRouter.post('/webhooks/lead', cors(), async (req, res) => {
  const key = req.get('x-webhook-key') ?? req.query.key;
  const { rows: [workspace] } =
    typeof key === 'string' && key.length >= 32
      ? await query('SELECT id FROM workspaces WHERE webhook_key = $1', [key])
      : { rows: [] };
  if (!workspace) {
    return res.status(401).json({
      ok: false,
      error: 'Clave de webhook inválida. Envía la cabecera X-Webhook-Key o el parámetro ?key=',
    });
  }
  return ingest(req, res, workspace.id, req.body);
});

// Used by the Settings screen to fire a sample lead through the same pipeline.
webhooksRouter.post('/webhooks/test', async (req, res) => {
  const samples = [
    { name: 'Valentina Rojas', company: 'Estudio Norte', source: 'Formulario web', value: 1800 },
    { name: 'Tomás Herrera', company: 'Herrera Logística', source: 'Landing page', value: 4200 },
    { name: 'Camila Fuentes', company: 'Café Origen', source: 'Instagram Ads', value: 950 },
    { name: 'Diego Navarro', company: 'Navarro & Asociados', source: 'Referido', value: 6500 },
  ];
  const sample = samples[Math.floor(Math.random() * samples.length)];
  const slug = sample.name.toLowerCase().split(' ')[0];
  return ingest(req, res, req.user.workspace_id, {
    ...sample,
    email: `${slug}@example.com`,
    phone: '+56 9 5555 0000',
    notes: 'Lead de prueba enviado desde Configuración.',
  });
});

webhooksRouter.get('/webhooks/events', async (req, res) => {
  const { rows } = await query(
    `SELECT e.id, e.status, e.lead_id, e.payload, e.error, e.created_at, l.name AS lead_name
       FROM webhook_events e LEFT JOIN leads l ON l.id = e.lead_id
      WHERE e.workspace_id = $1
      ORDER BY e.created_at DESC LIMIT 25`,
    [req.user.workspace_id],
  );
  res.json(rows);
});

webhooksRouter.get('/webhooks/config', async (req, res) => {
  const { rows: [ws] } = await query('SELECT webhook_key FROM workspaces WHERE id = $1', [
    req.user.workspace_id,
  ]);
  res.json({ key: ws.webhook_key });
});

// Invalidates the old key immediately; integrations must be updated.
webhooksRouter.post('/webhooks/rotate', requireOwner, async (req, res) => {
  const { rows: [ws] } = await query(
    `UPDATE workspaces
        SET webhook_key = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
      WHERE id = $1 RETURNING webhook_key`,
    [req.user.workspace_id],
  );
  res.json({ key: ws.webhook_key });
});
