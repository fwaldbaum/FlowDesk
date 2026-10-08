import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { query } from '../db.js';
import { createLead } from '../services/leads.js';
import { formatZodError, webhookLeadSchema } from '../validation.js';

export const webhooksRouter = Router();

const secret = process.env.WEBHOOK_SECRET || '';

function secretMatches(provided) {
  if (!secret) return true;
  if (typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function logEvent({ status, leadId = null, payload, error = null, ip }) {
  await query(
    `INSERT INTO webhook_events (status, lead_id, payload, error, ip) VALUES ($1, $2, $3, $4, $5)`,
    [status, leadId, payload ?? null, error, ip ?? null],
  ).catch((err) => console.error('[webhook] could not log event:', err.message));
}

async function ingest(req, res, payload) {
  try {
    const data = webhookLeadSchema.parse(payload);
    const lead = await createLead(data, { origin: 'webhook' });
    await logEvent({ status: 'accepted', leadId: lead.id, payload, ip: req.ip });
    res.status(201).json({ ok: true, lead });
  } catch (err) {
    if (!(err instanceof ZodError)) throw err;
    const details = formatZodError(err);
    await logEvent({
      status: 'rejected',
      payload,
      error: details.map((d) => d.message).join('; '),
      ip: req.ip,
    });
    res.status(422).json({ ok: false, error: 'Payload inválido', details });
  }
}

// Public ingestion endpoint: callable from forms, Zapier, Make, n8n, etc.
webhooksRouter.options('/webhooks/lead', cors());
webhooksRouter.post('/webhooks/lead', cors(), async (req, res) => {
  const provided = req.get('x-webhook-secret') ?? req.query.secret;
  if (!secretMatches(provided)) {
    await logEvent({ status: 'rejected', payload: req.body, error: 'Secreto inválido', ip: req.ip });
    return res.status(401).json({ ok: false, error: 'Secreto de webhook inválido' });
  }
  return ingest(req, res, req.body);
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
  return ingest(req, res, {
    ...sample,
    email: `${slug}@example.com`,
    phone: '+56 9 5555 0000',
    notes: 'Lead de prueba enviado desde Configuración.',
  });
});

webhooksRouter.get('/webhooks/events', async (_req, res) => {
  const { rows } = await query(
    `SELECT e.id, e.status, e.lead_id, e.payload, e.error, e.created_at, l.name AS lead_name
       FROM webhook_events e LEFT JOIN leads l ON l.id = e.lead_id
      ORDER BY e.created_at DESC LIMIT 25`,
  );
  res.json(rows);
});

webhooksRouter.get('/webhooks/config', (_req, res) => {
  res.json({ secretRequired: Boolean(secret) });
});
