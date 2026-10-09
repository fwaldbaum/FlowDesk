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

const ORIGIN_NOTES = {
  manual: 'Lead creado manualmente',
  webhook: 'Lead recibido vía webhook',
  form: 'Lead recibido desde el formulario web',
};
const ORIGIN_SOURCES = { webhook: 'Webhook', form: 'Formulario web' };

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
        input.source || ORIGIN_SOURCES[origin] || 'Manual',
        input.value ?? 0,
        status,
        position,
      ],
    );
    const created = [
      await insertNote(db, row.id, { kind: 'event', body: ORIGIN_NOTES[origin] ?? ORIGIN_NOTES.manual }),
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

// ---- Contact log, "Hoy" and CSV import ----------------------------------------

const CHANNEL_LABELS = { whatsapp: 'WhatsApp', call: 'llamada', email: 'correo' };

/** Records that someone reached out (WhatsApp/call/email button) and bumps last contact. */
export async function logContact(ws, id, channel) {
  const note = await withTransaction(async (db) => {
    const { rowCount } = await db.query(
      'UPDATE leads SET last_contact_at = now(), updated_at = now() WHERE id = $1 AND workspace_id = $2',
      [id, ws],
    );
    if (!rowCount) return null;
    return insertNote(db, id, { kind: 'event', body: `Contactado por ${CHANNEL_LABELS[channel]}` });
  });
  if (!note) return null;
  const lead = await getLead(ws, id);
  await broadcast(ws, 'note:created', note);
  await broadcast(ws, 'lead:updated', lead);
  return lead;
}

const OPEN = "('new', 'contacted', 'proposal')";

/** Everything that needs attention today, in one round trip. */
export async function today(ws) {
  const [reminders, fresh, stale, stats] = await Promise.all([
    query(
      `SELECT n.id, n.lead_id, n.body, n.due_at, l.name AS lead_name, l.company, l.phone, l.email, l.status
         FROM notes n JOIN leads l ON l.id = n.lead_id
        WHERE l.workspace_id = $1 AND n.kind = 'reminder' AND NOT n.done
          AND n.due_at < now() + interval '7 days'
        ORDER BY n.due_at LIMIT 100`,
      [ws],
    ),
    query(
      `${LEAD_SELECT} WHERE l.workspace_id = $1 AND l.status = 'new' AND l.last_contact_at IS NULL
        ORDER BY l.created_at DESC LIMIT 25`,
      [ws],
    ),
    query(
      `${LEAD_SELECT} WHERE l.workspace_id = $1 AND l.status IN ${OPEN}
          AND coalesce(l.last_contact_at, l.created_at) < now() - interval '7 days'
          AND NOT (l.status = 'new' AND l.last_contact_at IS NULL)
        ORDER BY coalesce(l.last_contact_at, l.created_at) LIMIT 25`,
      [ws],
    ),
    query(
      `SELECT
         (SELECT count(*) FROM leads WHERE workspace_id = $1 AND created_at > now() - interval '7 days')::int AS new_7d,
         (SELECT coalesce(sum(value), 0) FROM leads WHERE workspace_id = $1 AND status IN ${OPEN})::float AS open_value,
         (SELECT coalesce(sum(l.value), 0) FROM leads l WHERE l.workspace_id = $1 AND l.status = 'won'
             AND EXISTS (SELECT 1 FROM notes n WHERE n.lead_id = l.id AND n.kind = 'event'
                          AND n.body LIKE '% a Ganado' AND n.created_at >= date_trunc('month', now())))::float
           AS won_month,
         (SELECT count(*) FROM notes n JOIN leads l ON l.id = n.lead_id
           WHERE l.workspace_id = $1 AND n.kind = 'reminder' AND NOT n.done AND n.due_at < now())::int AS overdue`,
      [ws],
    ),
  ]);
  return { reminders: reminders.rows, fresh: fresh.rows, stale: stale.rows, stats: stats.rows[0] };
}

const digits = (v) => (v ?? '').replace(/\D/g, '');

/**
 * Bulk insert from a CSV. Rows are already validated; duplicates (same email or phone
 * as an existing lead or an earlier row) are skipped when `skipDuplicates` is set.
 * New leads go to the bottom of their column.
 */
export async function importLeads(ws, rows, { skipDuplicates = true } = {}) {
  const result = await withTransaction(async (db) => {
    const { rows: existing } = await db.query(
      'SELECT lower(email) AS email, phone FROM leads WHERE workspace_id = $1',
      [ws],
    );
    const seenEmails = new Set(existing.map((r) => r.email).filter(Boolean));
    const seenPhones = new Set(existing.map((r) => digits(r.phone)).filter((p) => p.length >= 7));
    const { rows: maxRows } = await db.query(
      'SELECT status, max(position) AS max FROM leads WHERE workspace_id = $1 GROUP BY status',
      [ws],
    );
    const nextPos = Object.fromEntries(maxRows.map((r) => [r.status, r.max + 1]));

    const skipped = [];
    const accepted = [];
    for (const { index, data } of rows) {
      const email = data.email?.toLowerCase() || null;
      const phone = digits(data.phone);
      if (skipDuplicates && ((email && seenEmails.has(email)) || (phone.length >= 7 && seenPhones.has(phone)))) {
        skipped.push(index);
        continue;
      }
      if (email) seenEmails.add(email);
      if (phone.length >= 7) seenPhones.add(phone);
      const status = data.status ?? 'new';
      const position = nextPos[status] ?? 0;
      nextPos[status] = position + 1;
      accepted.push({ ...data, status, position });
    }
    if (accepted.length === 0) return { created: 0, skipped };

    // Reserve ids up front so notes can reference them; then insert everything in two statements.
    const { rows: idRows } = await db.query(
      "SELECT nextval(pg_get_serial_sequence('leads', 'id'))::int AS id FROM generate_series(1, $1)",
      [accepted.length],
    );
    const ids = idRows.map((r) => r.id);
    const col = (fn) => accepted.map(fn);
    await db.query(
      `INSERT INTO leads (id, workspace_id, name, email, phone, company, source, value, status, position)
       SELECT id, $1, name, email, phone, company, source, value, status, position
         FROM unnest($2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::numeric[],
                     $9::text[], $10::int[])
           AS t(id, name, email, phone, company, source, value, status, position)`,
      [ws, ids, col((d) => d.name), col((d) => d.email || null), col((d) => d.phone || null),
        col((d) => d.company || null), col((d) => d.source || 'Importación CSV'), col((d) => d.value ?? 0),
        col((d) => d.status), col((d) => d.position)],
    );
    const noteIds = [...ids];
    const noteKinds = ids.map(() => 'event');
    const noteBodies = ids.map(() => 'Importado desde CSV');
    accepted.forEach((d, i) => {
      if (d.notes?.trim()) {
        noteIds.push(ids[i]);
        noteKinds.push('note');
        noteBodies.push(d.notes.trim());
      }
    });
    await db.query(
      `INSERT INTO notes (lead_id, kind, body) SELECT * FROM unnest($1::int[], $2::text[], $3::text[])`,
      [noteIds, noteKinds, noteBodies],
    );
    const created = accepted.length;
    return { created, skipped };
  });
  // One event instead of hundreds: open boards simply reload.
  if (result.created) await broadcast(ws, 'leads:reload', { count: result.created });
  return result;
}
