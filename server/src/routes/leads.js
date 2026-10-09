import { Router } from 'express';
import {
  addNote, createLead, deleteLead, deleteNote, getLead, listLeads, listNotes, moveLead,
  updateLead, updateNote,
} from '../services/leads.js';
import {
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
