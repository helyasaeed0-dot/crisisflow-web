import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';
import { notifyNotificationsChanged } from '../hooks/useNotifications';
import { incidentLinkFor } from '../utils/links';
import { timeAgo } from '../utils/format';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Notifications that were unread when the page opened stay highlighted as "new"
  const [freshIds, setFreshIds] = useState(() => new Set());
  const markedOnOpen = useRef(false);

  const markAllSeen = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      notifyNotificationsChanged();
    } catch {
      // The badge simply stays until the next successful attempt
    }
  }, []);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const data = await notificationApi.list({ page: p, limit: 20 });
        const unread = data.items.filter((n) => !n.read).map((n) => n._id);

        setFreshIds((prev) => new Set([...prev, ...unread]));
        setItems((prev) => {
          const incoming = data.items.map((n) => ({ ...n, read: true }));
          return p === 1 ? incoming : [...prev, ...incoming];
        });
        setPage(p);
        setPages(data.pagination.pages);
        setError('');

        // Opening the page counts as seeing every notification
        if (!markedOnOpen.current && data.unreadCount > 0) {
          markedOnOpen.current = true;
          markAllSeen();
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [markAllSeen]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  // A notification that arrives while this page is open is seen immediately
  useSocketEvent('notification.new', async (n) => {
    setItems((prev) => [{ ...n, read: true }, ...prev]);
    setFreshIds((prev) => new Set(prev).add(n._id));
    try {
      await notificationApi.markRead(n._id);
      notifyNotificationsChanged();
    } catch {
      // Not critical
    }
  });

  const open = (n) => {
    const link = incidentLinkFor(user.role, n.data?.incidentId);
    if (link) navigate(link);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>

      {error && <p className="text-sm text-critical">{error}</p>}

      {!loading && !items.length && (
        <EmptyState icon={Bell} title="No notifications yet" text="Updates about your emergencies will appear here." />
      )}

      <ul className="space-y-2">
        {items.map((n) => {
          const isFresh = freshIds.has(n._id);
          return (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => open(n)}
                className={`w-full rounded-xl border p-4 text-left transition hover:border-accent/60 ${
                  isFresh ? 'border-accent/40 bg-navy-900' : 'border-navy-700 bg-navy-900/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">
                    {isFresh && (
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent" aria-label="New" />
                    )}
                    {n.title}
                  </p>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{n.message}</p>
              </button>
            </li>
          );
        })}
      </ul>

      {loading && <Spinner />}

      {!loading && page < pages && (
        <button
          type="button"
          onClick={() => load(page + 1)}
          className="w-full rounded-lg border border-navy-700 py-2 text-sm font-semibold"
        >
          Load more
        </button>
      )}
    </div>
  );
}