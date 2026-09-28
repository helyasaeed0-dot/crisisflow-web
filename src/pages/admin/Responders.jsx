import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { responderApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useSocketEvent } from '../../context/SocketContext';
import { DemoTag } from '../../components/Badges';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { RESPONDER_TYPE_LABELS } from '../../utils/constants';
import { timeAgo } from '../../utils/format';

const selectClass = 'rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm';

const AVAILABILITY_STYLE = {
  AVAILABLE: 'bg-success/15 text-success',
  BUSY: 'bg-high/15 text-high',
  OFFLINE: 'bg-navy-700 text-muted',
};

const VERIFICATION_STYLE = {
  VERIFIED: 'text-success',
  PENDING: 'text-high',
  REJECTED: 'text-critical',
};

export default function Responders() {
  const [type, setType] = useState('');
  const [availability, setAvailability] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const params = useMemo(
    () => ({
      page,
      limit: 50,
      ...(type && { type }),
      ...(availability && { availability }),
      ...(verificationStatus && { verificationStatus }),
    }),
    [page, type, availability, verificationStatus]
  );

  const load = useCallback(async () => {
    try {
      setResult(await responderApi.list(params));
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

  // Availability changes whenever assignments start or finish
  useSocketEvent('incident.assigned', load);
  useSocketEvent('incident.resolved', load);
  useSocketEvent('demo.reset', load);

  const verify = async (responder, status) => {
    if (status === 'REJECTED' && !window.confirm(`Reject ${responder.user?.name}? They will not receive assignments.`)) return;
    setBusyId(responder._id);
    setError('');
    try {
      const updated = await responderApi.verify(responder._id, status);
      setResult((r) => ({
        ...r,
        items: r.items.map((x) => (x._id === updated._id ? { ...x, ...updated, user: x.user } : x)),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const pendingCount = result.items.filter((r) => r.verificationStatus === 'PENDING').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Responders</h1>
        {pendingCount > 0 && (
          <p className="rounded-lg bg-high/10 px-3 py-1.5 text-sm text-high">{pendingCount} waiting for verification</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={type} onChange={changeFilter(setType)} className={selectClass} aria-label="Filter by type">
          <option value="">All types</option>
          {Object.entries(RESPONDER_TYPE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select value={availability} onChange={changeFilter(setAvailability)} className={selectClass} aria-label="Filter by availability">
          <option value="">Any availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="OFFLINE">Offline</option>
        </select>
        <select value={verificationStatus} onChange={changeFilter(setVerificationStatus)} className={selectClass} aria-label="Filter by verification">
          <option value="">Any verification</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-navy-700 bg-navy-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-700 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Location updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {result.items.map((r) => (
              <tr key={r._id}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.user?.name || '—'}</p>
                  <p className="text-xs text-muted">{r.user?.email}{r.user?.phone ? ` · ${r.user.phone}` : ''}</p>
                </td>
                <td className="px-4 py-3">
                  {RESPONDER_TYPE_LABELS[r.type] || r.type} {r.isDemo && <DemoTag />}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${AVAILABILITY_STYLE[r.availability]}`}>
                    {r.availability}
                  </span>
                </td>
                <td className={`px-4 py-3 text-xs font-semibold ${VERIFICATION_STYLE[r.verificationStatus]}`}>
                  {r.verificationStatus}
                </td>
                <td className="px-4 py-3 text-muted">{r.lastLocationAt ? timeAgo(r.lastLocationAt) : 'Never'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {r.verificationStatus !== 'VERIFIED' && (
                      <button
                        type="button"
                        disabled={busyId === r._id}
                        onClick={() => verify(r, 'VERIFIED')}
                        className="inline-flex items-center gap-1 rounded-lg border border-success/50 px-2.5 py-1 text-xs font-semibold text-success disabled:opacity-50"
                      >
                        <ShieldCheck size={14} /> Verify
                      </button>
                    )}
                    {r.verificationStatus !== 'REJECTED' && (
                      <button
                        type="button"
                        disabled={busyId === r._id}
                        onClick={() => verify(r, 'REJECTED')}
                        className="inline-flex items-center gap-1 rounded-lg border border-critical/50 px-2.5 py-1 text-xs font-semibold text-critical disabled:opacity-50"
                      >
                        <ShieldX size={14} /> Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-4"><Spinner /></div>}
        {!loading && !result.items.length && <p className="p-6 text-center text-muted">No responders match these filters.</p>}
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