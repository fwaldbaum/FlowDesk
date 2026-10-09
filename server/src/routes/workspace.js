import { Router } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { query } from '../db.js';
import { requireOwner } from '../middleware/auth.js';
import { createRateLimiter } from '../services/auth.js';
import { createLead } from '../services/leads.js';
import { FORM_DEFAULTS, formatZodError, formSubmitSchema, workspaceUpdateSchema } from '../validation.js';

const withDefaults = (settings) => ({
  ...FORM_DEFAULTS,
  ...settings,
  fields: { ...FORM_DEFAULTS.fields, ...(settings?.fields ?? {}) },
});

// ---- Workspace settings (session-protected) ---------------------------------

export const workspaceRouter = Router();

async function loadWorkspace(id) {
  const { rows: [ws] } = await query(
    'SELECT id, name, country_code, whatsapp_template, form_key, form_settings FROM workspaces WHERE id = $1',
    [id],
  );
  return { ...ws, form_settings: withDefaults(ws.form_settings) };
}

workspaceRouter.get('/workspace', async (req, res) => {
  res.json(await loadWorkspace(req.user.workspace_id));
});

workspaceRouter.patch('/workspace', requireOwner, async (req, res) => {
  const patch = workspaceUpdateSchema.parse(req.body);
  const fields = Object.keys(patch);
  if (fields.length) {
    await query(
      `UPDATE workspaces SET ${fields.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1`,
      [req.user.workspace_id, ...fields.map((k) => (k === 'form_settings' ? JSON.stringify(patch[k]) : patch[k]))],
    );
  }
  res.json(await loadWorkspace(req.user.workspace_id));
});

// The old embed code stops working; useful if a form is being abused.
workspaceRouter.post('/workspace/form-key/rotate', requireOwner, async (req, res) => {
  await query(`UPDATE workspaces SET form_key = replace(gen_random_uuid()::text, '-', '') WHERE id = $1`, [
    req.user.workspace_id,
  ]);
  res.json(await loadWorkspace(req.user.workspace_id));
});

// ---- Public embeddable form ---------------------------------------------------

export const publicFormsRouter = Router();
const perIp = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 });
const perForm = createRateLimiter({ max: 300, windowMs: 60 * 60 * 1000 });

async function findForm(key) {
  if (typeof key !== 'string' || !/^[0-9a-f]{32}$/.test(key)) return null;
  const { rows: [ws] } = await query('SELECT id, name, form_settings FROM workspaces WHERE form_key = $1', [key]);
  return ws ?? null;
}

publicFormsRouter.use('/forms', cors());

publicFormsRouter.get('/forms/:key', async (req, res) => {
  const ws = await findForm(req.params.key);
  if (!ws) return res.status(404).json({ error: 'Formulario no encontrado' });
  const { source: _internal, ...settings } = withDefaults(ws.form_settings);
  res.json({ workspace: ws.name, settings });
});

publicFormsRouter.post('/forms/:key', async (req, res) => {
  const ws = await findForm(req.params.key);
  if (!ws) return res.status(404).json({ error: 'Formulario no encontrado' });
  const settings = withDefaults(ws.form_settings);
  try {
    const data = formSubmitSchema.parse(req.body);
    // Bots that fill the hidden field get a normal-looking success and nothing is stored.
    if (data.website) return res.status(201).json({ ok: true });
    if (settings.fields.phone && !data.phone) {
      return res.status(422).json({ error: 'Escribe tu teléfono', details: [{ field: 'phone', message: 'Escribe tu teléfono' }] });
    }
    const wait = Math.max(perIp.hit(`${req.ip}:${ws.id}`), perForm.hit(String(ws.id)));
    if (wait) return res.status(429).json({ error: 'Demasiados envíos. Intenta más tarde.' });

    await createLead(
      ws.id,
      {
        name: data.name,
        email: data.email,
        phone: settings.fields.phone ? data.phone : null,
        company: settings.fields.company ? data.company : null,
        source: settings.source,
        notes: settings.fields.message ? data.message : null,
      },
      { origin: 'form' },
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    if (!(err instanceof ZodError)) throw err;
    const details = formatZodError(err);
    res.status(422).json({ error: details[0]?.message ?? 'Datos inválidos', details });
  }
});
