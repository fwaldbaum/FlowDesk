import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ZodError } from 'zod';
import { pool } from './db.js';
import { migrate } from './migrate.js';
import { requireAuth } from './middleware/auth.js';
import { adminRouter } from './routes/admin.js';
import { authRouter, usersRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { leadsRouter } from './routes/leads.js';
import { publicWebhooksRouter, webhooksRouter } from './routes/webhooks.js';
import { formatZodError } from './validation.js';

export const app = express();

// Trust X-Forwarded-* only from private-network proxies (Replit, Render, nginx…) unless overridden,
// so clients can't spoof their IP to dodge login rate limits. Vercel's edge sets these headers itself.
app.set(
  'trust proxy',
  process.env.TRUST_PROXY ?? (process.env.VERCEL ? true : 'loopback, linklocal, uniquelocal'),
);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '256kb' }));

// Serverless platforms never run index.js, so make sure the schema exists before the
// first query. After the first call this is a resolved promise.
app.use('/api', async (_req, res, next) => {
  try {
    await migrate();
    next();
  } catch (err) {
    console.error('[db] migration failed:', err.message);
    res.status(503).json({ error: 'Base de datos no disponible. Revisa DATABASE_URL.' });
  }
});

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});
app.use('/api', authRouter);
app.use('/api', publicWebhooksRouter);
// Everything below requires a signed-in user.
app.use('/api', requireAuth);
app.use('/api', leadsRouter);
app.use('/api', webhooksRouter);
app.use('/api', usersRouter);
app.use('/api', eventsRouter);
app.use('/api', adminRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// On a long-lived server the API also serves the built SPA (on Vercel the client service does).
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

// Vercel's Express preset uses the default export as the request handler.
export default app;
