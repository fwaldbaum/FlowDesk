import { query, withTransaction } from '../db.js';
import { broadcast } from '../realtime.js';
import { STATUS_LABELS } from '../constants.js';

const LEAD_SELECT = `
  SELECT l.*,
         (SELECT count(*)::int FROM notes n
           WHERE n.lead_id = l.id AND n.kind = 'reminder' AND NOT n.done) AS pending_reminders
    FROM leads l`;

export async function listLeads() {
  const { rows } = await query(`${LEAD_SELECT} ORDER BY l.status, l.position, l.id`);
  return rows;
}

export async function getLead(id, db = { query }) {
  const { rows } = await db.query(`${LEAD_SELECT} WHERE l.id = $1`, [id]);
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
export async function createLead(input, { origin = 'manual' } = {}) {
  const status = input.status ?? 'new';
  const { lead, notes } = await withTransaction(async (db) => {
    const { rows: [{ min }] } = await db.query(
      'SELECT min(position) AS min FROM leads WHERE status = $1',
      [status],
    );
    const position = min === null ? 0 : min - 1;
    const { rows: [row] } = await db.query(
      `INSERT INTO leads (name, email, phone, company, source, value, status, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
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
    return { lead: await getLead(row.id, db), notes: created };
  });

  await broadcast('lead:created', { lead, origin });
  for (const note of notes) await broadcast('note:created', note);
  return lead;
}

const EDITABLE = ['name', 'email', 'phone', 'company', 'source', 'value', 'last_contact_at'];

export async function updateLead(id, patch) {
  const fields = EDITABLE.filter((k) => k in patch);
  if (fields.length === 0) return getLead(id);
  const sets = fields.map((k, i) => `${k} = $${i + 2}`);
  const { rowCount } = await query(
    `UPDATE leads SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`,
    [id, ...fields.map((k) => (patch[k] === '' ? null : patch[k]))],
  );
  if (rowCount === 0) return null;
  const lead = await getLead(id);
  await broadcast('lead:updated', lead);
  return lead;
}

/**
 * Move a lead to `status`, placed immediately before `beforeId` (or at the end when
 * null). The whole target column is renumbered so positions stay dense integers.
 */
export async function moveLead(id, { status, beforeId = null }) {
  const result = await withTransaction(async (db) => {
    const { rows: [current] } = await db.query(
      'SELECT id, status FROM leads WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!current) return null;

    const { rows } = await db.query(
      'SELECT id FROM leads WHERE status = $1 AND id <> $2 ORDER BY position, id FOR UPDATE',
      [status, id],
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
        WHERE l.id = o.id`,
      [order, status, id],
    );

    let note = null;
    if (current.status !== status) {
      note = await insertNote(db, id, {
        kind: 'event',
        body: `Movido de ${STATUS_LABELS[current.status]} a ${STATUS_LABELS[status]}`,
      });
    }
    return { lead: await getLead(id, db), order, note };
  });
  if (!result) return null;

  await broadcast('leads:reordered', { status, order: result.order });
  await broadcast('lead:updated', result.lead);
  if (result.note) await broadcast('note:created', result.note);
  return result.lead;
}

export async function deleteLead(id) {
  const { rowCount } = await query('DELETE FROM leads WHERE id = $1', [id]);
  if (rowCount > 0) await broadcast('lead:deleted', { id });
  return rowCount > 0;
}

// ---- Notes -----------------------------------------------------------------

export async function listNotes(leadId) {
  const { rows } = await query(
    'SELECT * FROM notes WHERE lead_id = $1 ORDER BY created_at DESC, id DESC',
    [leadId],
  );
  return rows;
}

export async function addNote(leadId, { kind, body, dueAt }) {
  const note = await withTransaction(async (db) => {
    const { rowCount } = await db.query('SELECT 1 FROM leads WHERE id = $1', [leadId]);
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
  await broadcast('note:created', note);
  await broadcast('lead:updated', await getLead(leadId));
  return note;
}

export async function updateNote(id, { done }) {
  const { rows: [note] } = await query(
    'UPDATE notes SET done = $2 WHERE id = $1 RETURNING *',
    [id, done],
  );
  if (!note) return null;
  await broadcast('note:updated', note);
  await broadcast('lead:updated', await getLead(note.lead_id));
  return note;
}

export async function deleteNote(id) {
  const { rows: [note] } = await query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
  if (!note) return false;
  await broadcast('note:deleted', { id, lead_id: note.lead_id });
  await broadcast('lead:updated', await getLead(note.lead_id));
  return true;
}
