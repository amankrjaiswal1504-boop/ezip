import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api, { API_ORIGIN } from '../services/api';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);

// One Socket.IO connection per logged-in session: live notifications (bell +
// toast), pickup status updates and collector locations.
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unread);
    } catch {
      /* offline */
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return undefined;
    }
    loadNotifications();
    const socket = io(API_ORIGIN, { withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('notification', (n) => {
      if (n._id) {
        setNotifications((prev) => [n, ...prev].slice(0, 50));
        setUnread((u) => u + 1);
      }
      toast(n.title + (n.body ? `\n${n.body}` : ''), { icon: '🔔', duration: 5000 });
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, loadNotifications]);

  const subscribe = useCallback((event, handler) => {
    const s = socketRef.current;
    if (!s) return () => {};
    s.on(event, handler);
    return () => s.off(event, handler);
  }, []);

  const watchPickup = useCallback((pickupId) => {
    const s = socketRef.current;
    if (!s) return () => {};
    const join = () => s.emit('pickup:watch', pickupId);
    if (s.connected) join();
    s.on('connect', join);
    return () => {
      s.off('connect', join);
      s.emit('pickup:unwatch', pickupId);
    };
  }, []);

  const markRead = useCallback(async (id = 'all') => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) => prev.map((n) => (id === 'all' || n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => (id === 'all' ? 0 : Math.max(0, u - 1)));
  }, []);

  return (
    <RealtimeContext.Provider value={{ connected, notifications, unread, markRead, subscribe, watchPickup, reload: loadNotifications, socket: socketRef }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
