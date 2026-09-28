import { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { responderApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import AssignmentCard from '../../components/incident/AssignmentCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';

export default function AssignmentHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await responderApi.myAssignments({ active: false });
      setItems(data);
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

  const completed = items.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <h1 className="text-xl font-bold">History</h1>
        {items.length > 0 && <p className="text-sm text-muted">{completed} completed</p>}
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}
      {loading && <Spinner />}

      {!loading && !items.length && (
        <EmptyState icon={History} title="No assignments yet" text="Your past assignments will appear here." />
      )}

      <div className="space-y-2">
        {items.map((a) => (
          <AssignmentCard key={a._id} assignment={a} />
        ))}
      </div>
    </div>
  );
}