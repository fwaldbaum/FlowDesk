import './env.js';
import pg from 'pg';

// NUMERIC comes back as string by default; values here fit comfortably in a double.
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

/**
 * Names Vercel's storage integrations (Neon, Supabase, Vercel Postgres) and common hosts use,
 * pooled URLs first. Integrations created with a custom prefix (e.g. STORAGE_URL,
 * MYDB_DATABASE_URL) are picked up by the scan below.
 */
const KNOWN_VARS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
];

const isPostgresUrl = (v) => typeof v === 'string' && /^postgres(ql)?:\/\//.test(v.trim());

function findConnectionString() {
  for (const name of KNOWN_VARS) {
    if (isPostgresUrl(process.env[name])) return { name, url: process.env[name].trim() };
  }
  const scanned = Object.keys(process.env)
    .filter((k) => /(_URL|DATABASE_URL|POSTGRES_URL)$/.test(k) && isPostgresUrl(process.env[k]))
    .sort((a, b) => Number(/NON_POOLING|UNPOOLED/.test(a)) - Number(/NON_POOLING|UNPOOLED/.test(b)));
  if (scanned[0]) return { name: scanned[0], url: process.env[scanned[0]].trim() };
  // Only a local install may fall back to a local database.
  if (!process.env.VERCEL) {
    return { name: null, url: 'postgres://postgres:postgres@localhost:5432/flowdesk' };
  }
  return { name: null, url: null };
}

/**
 * TLS with libpq semantics: `require` encrypts without verifying the certificate (what
 * Supabase's pooler and most hosted Postgres expect), `verify-*` verifies. node-postgres
 * treats `require` as `verify-full` and lets the URL override our ssl option, so the
 * sslmode is removed from the URL and applied here instead.
 */
function buildConfig(rawUrl) {
  const url = new URL(rawUrl);
  const sslmode = url.searchParams.get('sslmode');
  for (const p of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) url.searchParams.delete(p);

  const local = ['localhost', '127.0.0.1', '::1', ''].includes(url.hostname);
  let ssl;
  if (process.env.PGSSL === 'false' || sslmode === 'disable') ssl = false;
  else if (sslmode === 'verify-full' || sslmode === 'verify-ca') ssl = { rejectUnauthorized: true };
  else if (sslmode || process.env.PGSSL === 'true' || !local) ssl = { rejectUnauthorized: false };
  else ssl = false;

  return { connectionString: url.toString(), ssl, host: url.hostname };
}

const found = findConnectionString();
const config = found.url ? buildConfig(found.url) : null;

/** Safe-to-show facts about the DB configuration (never the URL or credentials). */
export const dbInfo = {
  configured: Boolean(found.url),
  source: found.name ?? (found.url ? 'default (localhost)' : null),
  ssl: config ? Boolean(config.ssl) : null,
};

export const pool = new pg.Pool({
  connectionString: config?.connectionString,
  ssl: config?.ssl,
  // Each serverless instance gets its own pool; keep it small so many instances fit the DB's limit.
  max: process.env.VERCEL ? 3 : 10,
  // Fail fast with a clear error instead of hanging until the function times out.
  connectionTimeoutMillis: 10_000,
});

export const query = (text, params) => {
  if (!config) return Promise.reject(Object.assign(new Error('DATABASE_URL is not set'), { code: 'NO_DATABASE_URL' }));
  return pool.query(text, params);
};

export async function withTransaction(fn) {
  if (!config) throw Object.assign(new Error('DATABASE_URL is not set'), { code: 'NO_DATABASE_URL' });
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

/** Turns a connection/migration error into an actionable message (Spanish, no secrets). */
export function explainDbError(err) {
  const code = err?.code ?? '';
  const msg = String(err?.message ?? '');
  if (code === 'NO_DATABASE_URL') {
    return 'No hay base de datos configurada. En Vercel: Storage → conecta una base Postgres (Neon o Supabase) o agrega DATABASE_URL en Settings → Environment Variables, y vuelve a desplegar.';
  }
  if (code === '28P01' || code === '28000') {
    return 'Usuario o contraseña de la base de datos incorrectos. Revisa la cadena de conexión en DATABASE_URL.';
  }
  if (code === '3D000') return 'La base de datos indicada en DATABASE_URL no existe.';
  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code)) return 'No se encuentra el servidor de la base de datos. Revisa el host en DATABASE_URL.';
  if (['ECONNREFUSED', 'ECONNRESET'].includes(code)) return 'El servidor de la base de datos rechazó la conexión. Revisa host y puerto en DATABASE_URL.';
  if (/timeout/i.test(msg) || code === 'ETIMEDOUT') {
    return 'La base de datos no respondió a tiempo. Si es Supabase o Neon, verifica que el proyecto no esté pausado.';
  }
  if (/certificate|SSL|TLS/i.test(msg) || /CERT|SSL/.test(code)) {
    return 'Error de SSL al conectar con la base de datos. Prueba agregando ?sslmode=require a DATABASE_URL.';
  }
  if (code === '42501') return 'El usuario de la base de datos no tiene permisos para crear tablas.';
  return `No se pudo preparar la base de datos (código ${code || 'desconocido'}).`;
}
