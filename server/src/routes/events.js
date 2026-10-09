import { Router } from 'express';
import { query } from '../db.js';
import { REALTIME_MODE } from '../realtime.js';

export const eventsRouter = Router();

/** Tells the client which realtime transport to use and where the feed currently ends. */
eventsRouter.get('/events/cursor', async (req, res) => {
  const { rows: [{ max }] } = await query(
    'SELECT coalesce(max(id), 0)::bigint AS max FROM events WHERE workspace_id = $1',
    [req.user.workspace_id],
  );
  res.json({ mode: REALTIME_MODE, cursor: Number(max) });
});

/**
 * Events after `after`. Serial ids can commit out of order across concurrent
 * transactions, so the last few seconds are always resent; clients dedupe by id.
 */
eventsRouter.get('/events', async (req, res) => {
  const after = Number(req.query.after) || 0;
  const { rows } = await query(
    `SELECT id, type, payload FROM events
      WHERE workspace_id = $2 AND (id > $1 OR created_at > now() - interval '15 seconds')
      ORDER BY id LIMIT 500`,
    [after, req.user.workspace_id],
  );
  res.json(rows.map((r) => ({ ...r, id: Number(r.id) })));
});
