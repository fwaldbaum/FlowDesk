import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

export async function migrate() {
  const sql = await readFile(fileURLToPath(new URL('./schema.sql', import.meta.url)), 'utf8');
  await pool.query(sql);
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
