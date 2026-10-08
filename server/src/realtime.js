import { Server } from 'socket.io';

let io = null;

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? true },
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
