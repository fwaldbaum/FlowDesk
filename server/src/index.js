import { createServer } from 'node:http';
import { app } from './app.js';
import { migrate } from './migrate.js';
import { initRealtime, REALTIME_MODE } from './realtime.js';

const PORT = Number(process.env.PORT) || 3001;

const server = createServer(app);
initRealtime(server);

try {
  await migrate();
} catch (err) {
  console.error('[db] cannot connect or migrate. Is DATABASE_URL set?\n', err.message);
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`[flowdesk] API listening on http://localhost:${PORT} (realtime: ${REALTIME_MODE})`);
});
