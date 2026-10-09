import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { SCHEMA_SQL } from './schema.js';

let ready = null;

/** Apply the schema once per process (or serverless instance). Retries after a failure. */
export function migrate() {
  ready ??= pool.query(SCHEMA_SQL).catch((err) => {
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
