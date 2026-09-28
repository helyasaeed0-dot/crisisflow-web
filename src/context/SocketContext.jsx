import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { tokenStore, API_URL } from '../api/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return undefined;

    // auth as a function: the latest (possibly refreshed) token is sent on every reconnect
        // Same origin in development (Vite proxy); the backend URL in production
    const s = io(API_URL || undefined, {
      auth: (cb) => cb({ token: tokenStore.getAccess() }),
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => console.warn('Socket connection error:', err.message));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

// Subscribes to a socket event; the handler always sees the latest state
export function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (payload) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
}

// Follows one incident live (re-joins automatically after a reconnect)
export function useJoinIncident(incidentId) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !incidentId) return undefined;

    const join = () => {
      socket.emit('incident:join', incidentId, (res) => {
        if (!res?.ok) console.warn('Could not follow incident:', res?.message);
      });
    };

    if (socket.connected) join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
      socket.emit('incident:leave', incidentId);
    };
  }, [socket, incidentId]);
}