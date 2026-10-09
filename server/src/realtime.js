import { Server } from 'socket.io';
import { query } from './db.js';
import { getSession, parseCookies, SESSION_COOKIE } from './services/auth.js';

/**
 * 'socket': push over Socket.io (long-lived servers: local, Replit, Render, a VPS).
 * 'poll':   persist events in Postgres and let clients poll /api/events. Needed on
 *           serverless platforms such as Vercel, which can't hold WebSocket connections.
 */
export const REALTIME_MODE =
  process.env.REALTIME_MODE === 'poll' || process.env.REALTIME_MODE === 'socket'
    ? process.env.REALTIME_MODE
    : process.env.VERCEL
      ? 'poll'
      : 'socket';

let io = null;

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? false, credentials: true },
  });

  // Only signed-in users receive lead data.
  io.use(async (socket, next) => {
    try {
      const token = parseCookies(socket.handshake.headers.cookie)[SESSION_COOKIE];
      const session = await getSession(token);
      if (!session) return next(new Error('unauthorized'));
      socket.data.user = session.user;
      socket.join([
        `workspace:${session.user.workspace_id}`,
        `user:${session.user.id}`,
        `session:${session.sessionId}`,
      ]);
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    socket.emit('hello', { at: new Date().toISOString() });
  });
  return io;
}

/**
 * Notify every open board of one workspace. Awaited by callers: on serverless the instance
 * may freeze as soon as the response is sent, so the event row must be written first.
 */
export async function broadcast(workspaceId, event, payload) {
  io?.to(`workspace:${workspaceId}`).emit(event, payload);
  if (REALTIME_MODE !== 'poll') return;
  await query('INSERT INTO events (workspace_id, type, payload) VALUES ($1, $2, $3)', [
    workspaceId,
    event,
    JSON.stringify(payload),
  ]);
  // Clients poll every few seconds, so a few minutes of history is plenty.
  if (Math.random() < 0.05) {
    await query(`DELETE FROM events WHERE created_at < now() - interval '10 minutes'`);
  }
}

export function disconnectSession(sessionId) {
  io?.in(`session:${sessionId}`).disconnectSockets(true);
}

export function disconnectUser(userId) {
  io?.in(`user:${userId}`).disconnectSockets(true);
}

export function disconnectWorkspace(workspaceId) {
  io?.in(`workspace:${workspaceId}`).disconnectSockets(true);
}
