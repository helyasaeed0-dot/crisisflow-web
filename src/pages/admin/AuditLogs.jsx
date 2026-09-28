import { useCallback, useEffect, useMemo, useState } from 'react';
import { auditApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/format';

const ENTITIES = ['Incident', 'Responder', 'User', 'Demo'];
const selectClass = 'rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm';

export default function AuditLogs() {
  const [entity, setEntity] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Action names are exact matches, e.g. INCIDENT_VERIFIED
  useEffect(() => {
    const timer = setTimeout(() => {
      setAction(actionInput.trim().toUpperCase());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [actionInput]);

  const params = useMemo(
    () => ({ page, limit: 50, ...(entity && { entity }), ...(action && { action }) }),
    [page, entity, action]
  );

  const load = useCallback(async () => {
    try {
      setResult(await auditApi.list(params));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted">Every privileged action is recorded here.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value);
            setPage(1);
          }}
          className={selectClass}
          aria-label="Filter by entity"
        >
          <option value="">All entities</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input
          value={actionInput}
          onChange={(e) => setActionInput(e.target.value)}
          placeholder="Action, e.g. INCIDENT_VERIFIED"
          className="w-72 rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-navy-700 bg-navy-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-700 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700 align-top">
            {result.items.map((log) => (
              <tr key={log._id}>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{log.user?.name || 'System'}</p>
                  {log.user?.role && <p className="text-xs text-muted">{log.user.role}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3">
                  {log.entity}
                  {log.entityId && <span className="ml-1 text-xs text-muted">…{String(log.entityId).slice(-6)}</span>}
                </td>
                <td className="px-4 py-3">
                  {log.meta && Object.keys(log.meta).length > 0 ? (
                    <details>
                      <summary className="cursor-pointer text-xs text-accent">View</summary>
                      <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-navy-950 p-2 text-[11px] text-muted">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-4"><Spinner /></div>}
        {!loading && !result.items.length && <p className="p-6 text-center text-muted">No audit entries found.</p>}
      </div>

      <Pagination
        page={result.pagination.page}
        pages={result.pagination.pages}
        total={result.pagination.total}
        onChange={setPage}
      />
    </div>
  );
}