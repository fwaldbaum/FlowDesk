// Grants platform-admin rights to an existing account.
// Usage: npm run admin:grant -- correo@ejemplo.com
// Against production: `npx vercel env pull .env` first, so DATABASE_URL points there.
import { pool } from './db.js';
import { migrate } from './migrate.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Uso: npm run admin:grant -- correo@ejemplo.com');
  process.exit(1);
}

await migrate();
const { rows: [user] } = await pool.query(
  'UPDATE users SET is_admin = true WHERE email = $1 RETURNING name, email',
  [email],
);
await pool.end();

if (!user) {
  console.error(`[admin] No hay ninguna cuenta con ${email}. Regístrate primero en /registro.`);
  process.exit(1);
}
console.log(`[admin] ${user.name} <${user.email}> ahora es administrador.`);
