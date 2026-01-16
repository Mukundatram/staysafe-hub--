import { io as ioClient } from 'socket.io-client';
import { getToken } from './authHelpers';

let socket = null;

export function connectSocket() {
  if (socket) return socket;
  const token = getToken();
  socket = ioClient('/', {
    auth: { token },
    path: '/socket.io'
  });

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] connect_error', err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
