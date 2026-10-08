// Vercel Function: every /api/* request is rewritten here (see vercel.json) and handled
// by the same Express app used in long-lived deployments.
import { app } from '../server/src/app.js';
import { migrate } from '../server/src/migrate.js';

// Apply the idempotent schema once per cold start, before the first request.
let ready = null;

export default async function handler(req, res) {
  ready ??= migrate().catch((err) => {
    ready = null; // retry on the next request instead of caching the failure
    throw err;
  });
  try {
    await ready;
  } catch (err) {
    console.error('[db] migration failed:', err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Base de datos no disponible. Revisa DATABASE_URL.' }));
  }
  return app(restoreOriginalUrl(req), res);
}

/**
 * The rewrite `/api/:path*` -> `/api` may hand the function `/api?path=leads/1` instead of the
 * original URL. Rebuild `/api/leads/1` so Express routes it normally.
 */
function restoreOriginalUrl(req) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api' && url.searchParams.has('path')) {
    const path = url.searchParams.get('path');
    url.searchParams.delete('path');
    req.url = `/api/${path}${url.search}`;
  }
  return req;
}
