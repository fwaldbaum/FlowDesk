import './env.js';
import pg from 'pg';

// NUMERIC comes back as string by default; values here fit comfortably in a double.
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/flowdesk';

// Hosted providers (Supabase, Neon, Replit) require TLS; local Postgres usually doesn't.
const needsSsl =
  process.env.PGSSL === 'true' || /sslmode=require/.test(connectionString);

export const pool = new pg.Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
