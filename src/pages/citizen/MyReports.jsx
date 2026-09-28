import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { incidentApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useSocketEvent } from '../../context/SocketContext';
import IncidentCard from '../../components/incident/IncidentCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
];

const isResolved = (i) => ['RESOLVED', 'CLOSED'].includes(i.status);

export default function MyReports() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await incidentApi.list({ limit: 50 });
      setItems(data.items);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useSocketEvent('notification.new', load);

  const visible = useMemo(() => {
    if (tab === 'active') return items.filter((i) => !isResolved(i));
    if (tab === 'resolved') return items.filter(isResolved);
    return items;
  }, [items, tab]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Reports</h1>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy-900 p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md py-2 text-sm font-semibold ${tab === t.key ? 'bg-navy-700 text-fg' : 'text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}
      {loading && <Spinner />}

      {!loading && !visible.length && (
        <EmptyState
          icon={FileText}
          title="Nothing here"
          text={tab === 'active' ? 'You have no active emergencies.' : 'No reports in this list yet.'}
          action={<Link to="/citizen/report" className="font-semibold text-accent">Report an emergency</Link>}
        />
      )}

      <div className="space-y-2">
        {visible.map((incident) => (
          <IncidentCard key={incident._id} incident={incident} to={`/citizen/track/${incident._id}`} />
        ))}
      </div>
    </div>
  );
}