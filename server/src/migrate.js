import { fileURLToPath } from 'node:url';
import { pool, withTransaction } from './db.js';
import { SCHEMA_SQL } from './schema.js';

let ready = null;

/**
 * Apply the schema once per process (or serverless instance). Runs in a transaction
 * behind an advisory lock so concurrent cold starts can't migrate at the same time.
 */
export function migrate() {
  ready ??= withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock(727274)');
    await db.query(SCHEMA_SQL);
  }).catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

// Allow `node src/migrate.js` as a standalone command.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => {
      console.log('[db] schema up to date');
      return pool.end();
    })
    .catch((err) => {
      console.error('[db] migration failed:', err.message);
      process.exit(1);
    });
}
