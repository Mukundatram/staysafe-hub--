import { io as ioClient } from 'socket.io-client';
import { getToken } from './authHelpers';

let socket = null;

export function connectSocket() {
  if (socket) return socket;
  const token = getToken();
  if (!token) {
    console.warn('[socket] not connecting: no auth token present');
    return null;
  }

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

// Attempt to reconnect using token if present. Safe to call after login.
export function reconnectSocket() {
  const token = getToken();
  if (!token) {
    console.warn('[socket] reconnect skipped: no auth token present');
    return null;
  }
  // If an existing socket exists, disconnect first to ensure fresh auth
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return connectSocket();
}
