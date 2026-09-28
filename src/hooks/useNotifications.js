import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';

const CHANGED_EVENT = 'notifications:changed';

// Call after marking notifications as read so the bell count updates
export const notifyNotificationsChanged = () => window.dispatchEvent(new Event(CHANGED_EVENT));

export default function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationApi.unreadCount();
      setUnreadCount(data.unreadCount);
    } catch {
      // Not critical: the count will refresh on the next event
    }
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener(CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHANGED_EVENT, refresh);
  }, [refresh]);

  useSocketEvent('notification.new', (notification) => {
    setUnreadCount((c) => c + 1);
    setLatest(notification);
  });

  // Auto-hide the toast after a few seconds
  useEffect(() => {
    if (!latest) return undefined;
    const timer = setTimeout(() => setLatest(null), 6000);
    return () => clearTimeout(timer);
  }, [latest]);

  return { unreadCount, latest, dismissLatest: () => setLatest(null), refresh };
}