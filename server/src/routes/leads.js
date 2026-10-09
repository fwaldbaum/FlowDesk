import { Router } from 'express';
import {
  addNote, createLead, deleteLead, deleteNote, getLead, importLeads, listLeads, listNotes, logContact,
  moveLead, today, updateLead, updateNote,
} from '../services/leads.js';
import {
  contactSchema, importSchema,
  leadCreateSchema, leadMoveSchema, leadUpdateSchema, noteCreateSchema, noteUpdateSchema,
} from '../validation.js';

export const leadsRouter = Router();

const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('ID inválido');
    err.status = 400;
    throw err;
  }
  return id;
};

/** The signed-in user's workspace: every query below is scoped to it. */
const ws = (req) => req.user.workspace_id;

const notFound = (res, what = 'Lead') => res.status(404).json({ error: `${what} no encontrado` });

leadsRouter.get('/leads', async (req, res) => {
  res.json(await listLeads(ws(req)));
});

leadsRouter.get('/today', async (req, res) => {
  res.json(await today(ws(req)));
});

leadsRouter.post('/leads/import', async (req, res) => {
  const { rows, skipDuplicates } = importSchema.parse(req.body);
  const valid = [];
  const invalid = [];
  rows.forEach((row, index) => {
    const parsed = leadCreateSchema.safeParse(row);
    if (parsed.success) valid.push({ index, data: parsed.data });
    else invalid.push({ row: index + 1, message: parsed.error.issues[0]?.message ?? 'Fila inválida' });
  });
  const { created, skipped } = await importLeads(ws(req), valid, { skipDuplicates });
  res.json({ created, skipped: skipped.length, invalid });
});

leadsRouter.post('/leads', async (req, res) => {
  const lead = await createLead(ws(req), leadCreateSchema.parse(req.body));
  res.status(201).json(lead);
});

leadsRouter.get('/leads/:id', async (req, res) => {
  const lead = await getLead(ws(req), idParam(req));
  return lead ? res.json(lead) : notFound(res);
});

leadsRouter.patch('/leads/:id', async (req, res) => {
  const lead = await updateLead(ws(req), idParam(req), leadUpdateSchema.parse(req.body));
  return lead ? res.json(lead) : notFound(res);
});

leadsRouter.post('/leads/:id/move', async (req, res) => {
  const lead = await moveLead(ws(req), idParam(req), leadMoveSchema.parse(req.body));
  return lead ? res.json(lead) : notFound(res);
});

leadsRouter.post('/leads/:id/contact', async (req, res) => {
  const lead = await logContact(ws(req), idParam(req), contactSchema.parse(req.body).channel);
  return lead ? res.json(lead) : notFound(res);
});

leadsRouter.delete('/leads/:id', async (req, res) => {
  return (await deleteLead(ws(req), idParam(req))) ? res.status(204).end() : notFound(res);
});

leadsRouter.get('/leads/:id/notes', async (req, res) => {
  res.json(await listNotes(ws(req), idParam(req)));
});

leadsRouter.post('/leads/:id/notes', async (req, res) => {
  const note = await addNote(ws(req), idParam(req), noteCreateSchema.parse(req.body));
  return note ? res.status(201).json(note) : notFound(res);
});

leadsRouter.patch('/notes/:id', async (req, res) => {
  const note = await updateNote(ws(req), idParam(req), noteUpdateSchema.parse(req.body));
  return note ? res.json(note) : notFound(res, 'Nota');
});

leadsRouter.delete('/notes/:id', async (req, res) => {
  return (await deleteNote(ws(req), idParam(req))) ? res.status(204).end() : notFound(res, 'Nota');
});
