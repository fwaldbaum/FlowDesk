import { query, withTransaction } from '../db.js';
import { broadcast } from '../realtime.js';
import { STATUS_LABELS } from '../constants.js';

// Every function takes the caller's workspace id and never touches rows outside it.

const LEAD_SELECT = `
  SELECT l.*,
         (SELECT count(*)::int FROM notes n
           WHERE n.lead_id = l.id AND n.kind = 'reminder' AND NOT n.done) AS pending_reminders
    FROM leads l`;

export async function listLeads(ws) {
  const { rows } = await query(
    `${LEAD_SELECT} WHERE l.workspace_id = $1 ORDER BY l.status, l.position, l.id`,
    [ws],
  );
  return rows;
}

export async function getLead(ws, id, db = { query }) {
  const { rows } = await db.query(`${LEAD_SELECT} WHERE l.id = $1 AND l.workspace_id = $2`, [id, ws]);
  return rows[0] ?? null;
}

async function insertNote(db, leadId, { kind = 'note', body, dueAt = null }) {
  const { rows } = await db.query(
    `INSERT INTO notes (lead_id, kind, body, due_at) VALUES ($1, $2, $3, $4) RETURNING *`,
    [leadId, kind, body, dueAt],
  );
  return rows[0];
}

/**
 * Create a lead at the top of its column. Shared by the UI form and the webhook so
 * both paths produce identical rows and realtime events.
 */
export async function createLead(ws, input, { origin = 'manual' } = {}) {
  const status = input.status ?? 'new';
  const { lead, notes } = await withTransaction(async (db) => {
    const { rows: [{ min }] } = await db.query(
      'SELECT min(position) AS min FROM leads WHERE workspace_id = $1 AND status = $2',
      [ws, status],
    );
    const position = min === null ? 0 : min - 1;
    const { rows: [row] } = await db.query(
      `INSERT INTO leads (workspace_id, name, email, phone, company, source, value, status, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        ws,
        input.name,
        input.email || null,
        input.phone || null,
        input.company || null,
        input.source || (origin === 'webhook' ? 'Webhook' : 'Manual'),
        input.value ?? 0,
        status,
        position,
      ],
    );
    const created = [
      await insertNote(db, row.id, {
        kind: 'event',
        body: origin === 'webhook' ? 'Lead recibido vía webhook' : 'Lead creado manualmente',
      }),
    ];
    if (input.notes?.trim()) {
      created.push(await insertNote(db, row.id, { body: input.notes.trim() }));
    }
    return { lead: await getLead(ws, row.id, db), notes: created };
  });

  await broadcast(ws, 'lead:created', { lead, origin });
  for (const note of notes) await broadcast(ws, 'note:created', note);
  return lead;
}

const EDITABLE = ['name', 'email', 'phone', 'company', 'source', 'value', 'last_contact_at'];

export async function updateLead(ws, id, patch) {
  const fields = EDITABLE.filter((k) => k in patch);
  if (fields.length === 0) return getLead(ws, id);
  const sets = fields.map((k, i) => `${k} = $${i + 3}`);
  const { rowCount } = await query(
    `UPDATE leads SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 AND workspace_id = $2`,
    [id, ws, ...fields.map((k) => (patch[k] === '' ? null : patch[k]))],
  );
  if (rowCount === 0) return null;
  const lead = await getLead(ws, id);
  await broadcast(ws, 'lead:updated', lead);
  return lead;
}

/**
 * Move a lead to `status`, placed immediately before `beforeId` (or at the end when
 * null). The whole target column is renumbered so positions stay dense integers.
 */
export async function moveLead(ws, id, { status, beforeId = null }) {
  const result = await withTransaction(async (db) => {
    const { rows: [current] } = await db.query(
      'SELECT id, status FROM leads WHERE id = $1 AND workspace_id = $2 FOR UPDATE',
      [id, ws],
    );
    if (!current) return null;

    const { rows } = await db.query(
      `SELECT id FROM leads WHERE workspace_id = $1 AND status = $2 AND id <> $3
        ORDER BY position, id FOR UPDATE`,
      [ws, status, id],
    );
    const order = rows.map((r) => r.id);
    const at = beforeId == null ? -1 : order.indexOf(beforeId);
    order.splice(at === -1 ? order.length : at, 0, id);

    await db.query(
      `UPDATE leads AS l
          SET position = o.pos - 1,
              status = $2,
              updated_at = CASE WHEN l.id = $3 THEN now() ELSE l.updated_at END
         FROM unnest($1::int[]) WITH ORDINALITY AS o(id, pos)
        WHERE l.id = o.id AND l.workspace_id = $4`,
      [order, status, id, ws],
    );

    let note = null;
    if (current.status !== status) {
      note = await insertNote(db, id, {
        kind: 'event',
        body: `Movido de ${STATUS_LABELS[current.status]} a ${STATUS_LABELS[status]}`,
      });
    }
    return { lead: await getLead(ws, id, db), order, note };
  });
  if (!result) return null;

  await broadcast(ws, 'leads:reordered', { status, order: result.order });
  await broadcast(ws, 'lead:updated', result.lead);
  if (result.note) await broadcast(ws, 'note:created', result.note);
  return result.lead;
}

export async function deleteLead(ws, id) {
  const { rowCount } = await query('DELETE FROM leads WHERE id = $1 AND workspace_id = $2', [id, ws]);
  if (rowCount > 0) await broadcast(ws, 'lead:deleted', { id });
  return rowCount > 0;
}

// ---- Notes -----------------------------------------------------------------

export async function listNotes(ws, leadId) {
  const { rows } = await query(
    `SELECT n.* FROM notes n JOIN leads l ON l.id = n.lead_id
      WHERE n.lead_id = $1 AND l.workspace_id = $2
      ORDER BY n.created_at DESC, n.id DESC`,
    [leadId, ws],
  );
  return rows;
}

export async function addNote(ws, leadId, { kind, body, dueAt }) {
  const note = await withTransaction(async (db) => {
    const { rowCount } = await db.query('SELECT 1 FROM leads WHERE id = $1 AND workspace_id = $2', [
      leadId,
      ws,
    ]);
    if (rowCount === 0) return null;
    const created = await insertNote(db, leadId, { kind, body, dueAt });
    // A written note means someone talked to the lead; reminders are future intent.
    if (kind === 'note') {
      await db.query(
        'UPDATE leads SET last_contact_at = now(), updated_at = now() WHERE id = $1',
        [leadId],
      );
    }
    return created;
  });
  if (!note) return null;
  await broadcast(ws, 'note:created', note);
  await broadcast(ws, 'lead:updated', await getLead(ws, leadId));
  return note;
}

export async function updateNote(ws, id, { done }) {
  const { rows: [note] } = await query(
    `UPDATE notes n SET done = $3 FROM leads l
      WHERE n.id = $1 AND l.id = n.lead_id AND l.workspace_id = $2
      RETURNING n.*`,
    [id, ws, done],
  );
  if (!note) return null;
  await broadcast(ws, 'note:updated', note);
  await broadcast(ws, 'lead:updated', await getLead(ws, note.lead_id));
  return note;
}

export async function deleteNote(ws, id) {
  const { rows: [note] } = await query(
    `DELETE FROM notes n USING leads l
      WHERE n.id = $1 AND l.id = n.lead_id AND l.workspace_id = $2
      RETURNING n.*`,
    [id, ws],
  );
  if (!note) return false;
  await broadcast(ws, 'note:deleted', { id, lead_id: note.lead_id });
  await broadcast(ws, 'lead:updated', await getLead(ws, note.lead_id));
  return true;
}
