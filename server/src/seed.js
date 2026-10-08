import { pool, withTransaction } from './db.js';
import { migrate } from './migrate.js';

const DAY = 86_400_000;
const ago = (days) => new Date(Date.now() - days * DAY);

const leads = [
  { name: 'Sofía Martínez', company: 'Panadería La Espiga', source: 'Formulario web', value: 1200, status: 'new', email: 'sofia@laespiga.cl', phone: '+56 9 8123 4567' },
  { name: 'Andrés Salinas', company: 'Salinas Arquitectos', source: 'LinkedIn', value: 5400, status: 'new', email: 'andres@salinas.cl' },
  { name: 'Lucía Paredes', company: 'Clínica Dental Sonríe', source: 'Google Ads', value: 3200, status: 'new', phone: '+56 2 2345 6789' },
  { name: 'Martín Vidal', company: 'Vidal Transportes', source: 'Referido', value: 8900, status: 'contacted', email: 'mvidal@vidaltrans.cl', contact: 2 },
  { name: 'Isidora Campos', company: 'Yoga Studio Prana', source: 'Instagram', value: 750, status: 'contacted', email: 'hola@prana.cl', contact: 5 },
  { name: 'Felipe Araya', company: 'Araya Contadores', source: 'Formulario web', value: 2600, status: 'proposal', email: 'faraya@arayacont.cl', contact: 1 },
  { name: 'Josefina Lagos', company: 'Tienda Mapuche Arte', source: 'Feria', value: 4100, status: 'proposal', phone: '+56 9 7654 3210', contact: 3 },
  { name: 'Benjamín Rojas', company: 'Rojas Ferretería', source: 'Referido', value: 12500, status: 'won', email: 'compras@rojasferre.cl', contact: 7 },
  { name: 'Antonia Silva', company: 'Silva Eventos', source: 'Google Ads', value: 1900, status: 'lost', email: 'antonia@silvaeventos.cl', contact: 14 },
];

await migrate();
await withTransaction(async (db) => {
  await db.query('TRUNCATE leads, notes, webhook_events RESTART IDENTITY CASCADE');
  const positions = {};
  for (const lead of leads) {
    const position = (positions[lead.status] = (positions[lead.status] ?? -1) + 1);
    const { rows: [{ id }] } = await db.query(
      `INSERT INTO leads (name, email, phone, company, source, value, status, position, last_contact_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [lead.name, lead.email ?? null, lead.phone ?? null, lead.company, lead.source, lead.value,
        lead.status, position, lead.contact ? ago(lead.contact) : null, ago((lead.contact ?? 0) + 3)],
    );
    await db.query(
      `INSERT INTO notes (lead_id, kind, body, created_at) VALUES ($1, 'event', 'Lead creado manualmente', $2)`,
      [id, ago((lead.contact ?? 0) + 3)],
    );
    if (lead.contact) {
      await db.query(
        `INSERT INTO notes (lead_id, kind, body, created_at) VALUES ($1, 'note', $2, $3)`,
        [id, `Llamada inicial con ${lead.name.split(' ')[0]}. Interesado en el plan anual.`, ago(lead.contact)],
      );
    }
    if (lead.status === 'proposal') {
      await db.query(
        `INSERT INTO notes (lead_id, kind, body, due_at) VALUES ($1, 'reminder', 'Hacer seguimiento de la propuesta', $2)`,
        [id, new Date(Date.now() + 2 * DAY)],
      );
    }
  }
});
console.log(`[seed] inserted ${leads.length} demo leads`);
await pool.end();
