import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dashboardApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useSocketEvent } from '../context/SocketContext';
import { fromPoint } from '../utils/format';

const CLOSED = ['RESOLVED', 'CLOSED'];
const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

// Active first, then highest priority, then newest
function byPriority(a, b) {
  const aClosed = CLOSED.includes(a.status) ? 1 : 0;
  const bClosed = CLOSED.includes(b.status) ? 1 : 0;
  if (aClosed !== bClosed) return aClosed - bClosed;
  const rank = (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
  if (rank) return rank;
  const score = (b.severityScore || 0) - (a.severityScore || 0);
  if (score) return score;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

// All incidents and responders for the command center, kept live via sockets
export default function useLiveIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reloadTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await dashboardApi.liveMap();
      setIncidents(data.incidents);
      setResponders(data.responders);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => clearTimeout(reloadTimer.current);
  }, [load]);

  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(load, 800);
  }, [load]);

  const upsert = useCallback((payload) => {
    if (!payload?._id) return;
    const item = { ...payload, position: fromPoint(payload.location) };
    setIncidents((prev) => {
      const index = prev.findIndex((i) => i._id === item._id);
      if (index === -1) return [item, ...prev];
      const next = [...prev];
      next[index] = { ...next[index], ...item };
      return next;
    });
  }, []);

  useSocketEvent('incident.created', upsert);
  useSocketEvent('incident.updated', upsert);
  useSocketEvent('incident.assigned', (p) => {
    upsert(p);
    scheduleReload();
  });
  useSocketEvent('incident.resolved', (p) => {
    upsert(p);
    scheduleReload();
  });
  useSocketEvent('responder.accepted', scheduleReload);
  useSocketEvent('demo.reset', load);

  useSocketEvent('responder.location.updated', (p) => {
    if (!p?.location) return;
    setResponders((prev) => {
      const index = prev.findIndex((r) => String(r._id) === String(p.responderId));
      const entry = {
        _id: p.responderId,
        type: p.type,
        availability: p.availability,
        position: p.location,
        lastLocationAt: new Date().toISOString(),
      };
      if (index === -1) return [...prev, { ...entry, name: p.name }];
      const next = [...prev];
      next[index] = { ...next[index], ...entry, name: p.name || next[index].name };
      return next;
    });
  });

  const sorted = useMemo(() => [...incidents].sort(byPriority), [incidents]);
  const activeIncidents = useMemo(() => sorted.filter((i) => !CLOSED.includes(i.status)), [sorted]);

  return { incidents: sorted, activeIncidents, responders, loading, error, reload: load };
}