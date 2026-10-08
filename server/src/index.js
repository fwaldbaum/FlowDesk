import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ZodError } from 'zod';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { initRealtime } from './realtime.js';
import { leadsRouter } from './routes/leads.js';
import { webhooksRouter } from './routes/webhooks.js';
import { formatZodError } from './validation.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});
app.use('/api', leadsRouter);
app.use('/api', webhooksRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// In production the API also serves the built SPA.
const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url));
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => res.sendFile(`${clientDist}/index.html`));
}

app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: 'Datos inválidos', details: formatZodError(err) });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Error interno' : err.message });
});

const server = createServer(app);
initRealtime(server);

try {
  await migrate();
} catch (err) {
  console.error('[db] cannot connect or migrate. Is DATABASE_URL set?\n', err.message);
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`[flowdesk] API + realtime listening on http://localhost:${PORT}`);
});
