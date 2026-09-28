import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { userApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/format';

const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  RESPONDER: 'Responder',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

// Responder roles are tied to a responder profile, so they are not changed here
const EDITABLE_ROLES = ['CITIZEN', 'ADMIN', 'SUPER_ADMIN'];

const selectClass = 'rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm';

export default function Users() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  // Wait until the admin stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(role && { role }),
      ...(status && { status }),
    }),
    [page, debouncedSearch, role, status]
  );

  const load = useCallback(async () => {
    try {
      setResult(await userApi.list(params));
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

  const update = async (u, body) => {
    if (body.status === 'SUSPENDED' && !window.confirm(`Suspend ${u.name}? They will be signed out immediately.`)) return;
    setBusyId(u._id);
    setError('');
    try {
      const updated = await userApi.update(u._id, body);
      setResult((r) => ({ ...r, items: r.items.map((x) => (x._id === updated._id ? updated : x)) }));
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex flex-wrap gap-3">
        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className="w-64 rounded-lg border border-navy-700 bg-navy-950 py-2 pl-9 pr-3 text-sm"
          />
        </label>
        <select value={role} onChange={changeFilter(setRole)} className={selectClass} aria-label="Filter by role">
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <select value={status} onChange={changeFilter(setStatus)} className={selectClass} aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-navy-700 bg-navy-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-700 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700">
            {result.items.map((u) => {
              const isMe = u._id === me?._id;
              const locked = isMe || u.role === 'RESPONDER';
              return (
                <tr key={u._id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {u.name} {isMe && <span className="text-xs text-accent">(you)</span>}
                    </p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {locked ? (
                      <span>{ROLE_LABELS[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={busyId === u._id}
                        onChange={(e) => update(u, { role: e.target.value })}
                        className={selectClass}
                        aria-label={`Role for ${u.name}`}
                      >
                        {EDITABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        u.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-critical/15 text-critical'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDateTime(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {!isMe && (
                      <button
                        type="button"
                        disabled={busyId === u._id}
                        onClick={() => update(u, { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                          u.status === 'ACTIVE' ? 'border-critical/50 text-critical' : 'border-success/50 text-success'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-4"><Spinner /></div>}
        {!loading && !result.items.length && <p className="p-6 text-center text-muted">No users found.</p>}
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