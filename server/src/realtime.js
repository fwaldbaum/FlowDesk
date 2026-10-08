import { Server } from 'socket.io';
import { getSession, parseCookies, SESSION_COOKIE } from './services/auth.js';

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
      socket.join([`user:${session.user.id}`, `session:${session.sessionId}`]);
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

/** Broadcast an event to every connected board. No-op before init (e.g. seed script). */
export function broadcast(event, payload) {
  io?.emit(event, payload);
}

export function disconnectSession(sessionId) {
  io?.in(`session:${sessionId}`).disconnectSockets(true);
}

export function disconnectUser(userId) {
  io?.in(`user:${userId}`).disconnectSockets(true);
}
