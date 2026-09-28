import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { incidentApi } from '../../api/endpoints';
import { useSocketEvent } from '../../context/SocketContext';
import useListQuery from '../../hooks/useListQuery';
import { CategoryLabel, SeverityBadge, StatusBadge, DemoTag } from '../../components/Badges';
import Pagination from '../../components/Pagination';
import Spinner from '../../components/Spinner';
import { CATEGORY_META, SEVERITY_META } from '../../utils/constants';
import { timeAgo } from '../../utils/format';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
];

const selectClass = 'rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm';

export default function Incidents() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [severity, setSeverity] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('priority');
  const [page, setPage] = useState(1);
  const timer = useRef(null);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      sort,
      ...(severity && { severity }),
      ...(category && { category }),
      ...(tab === 'active' && { active: true }),
      ...(tab === 'resolved' && { status: 'RESOLVED,CLOSED' }),
    }),
    [page, sort, severity, category, tab]
  );

  const { result, loading, error, reload } = useListQuery(incidentApi.list, params);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Keep the list fresh while the admin is looking at it
  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(reload, 1000);
  };
  useSocketEvent('incident.created', schedule);
  useSocketEvent('incident.updated', schedule);
  useSocketEvent('incident.resolved', schedule);
  useSocketEvent('demo.reset', schedule);

  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const hasFilters = severity || category;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Incidents</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy-900 p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${tab === t.key ? 'bg-navy-700 text-fg' : 'text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select value={severity} onChange={changeFilter(setSeverity)} className={selectClass} aria-label="Filter by severity">
          <option value="">All severities</option>
          {Object.entries(SEVERITY_META).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>

        <select value={category} onChange={changeFilter(setCategory)} className={selectClass} aria-label="Filter by category">
          <option value="">All categories</option>
          {Object.entries(CATEGORY_META).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>

        <select value={sort} onChange={changeFilter(setSort)} className={selectClass} aria-label="Sort">
          <option value="priority">Highest priority first</option>
          <option value="recent">Newest first</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSeverity('');
              setCategory('');
              setPage(1);
            }}
            className="text-sm font-semibold text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-navy-700 bg-navy-900">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-700 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Reported</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-navy-700 ${loading ? 'opacity-60' : ''}`}>
            {result.items.map((i) => (
              <tr
                key={i._id}
                onClick={() => navigate(`/admin/incidents/${i._id}`)}
                className="cursor-pointer hover:bg-navy-800"
              >
                <td className="px-4 py-3">
                  <Link to={`/admin/incidents/${i._id}`} className="font-semibold text-accent" onClick={(e) => e.stopPropagation()}>
                    {i.referenceId}
                  </Link>
                  <div className="mt-1 flex gap-1">
                    {i.needsReview && <span className="rounded bg-high/15 px-1.5 py-0.5 text-[10px] font-bold text-high">REVIEW</span>}
                    {i.isDemo && <DemoTag />}
                  </div>
                </td>
                <td className="px-4 py-3"><CategoryLabel category={i.category} /></td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={i.severity} resolved={['RESOLVED', 'CLOSED'].includes(i.status)} />
                  <span className="ml-2 text-xs text-muted">{i.severityScore}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                <td className="px-4 py-3">{i.reportCount}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted">{i.address || '—'}</td>
                <td className="px-4 py-3 text-muted">{timeAgo(i.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && !result.items.length && <div className="p-4"><Spinner /></div>}
        {!loading && !result.items.length && <p className="p-6 text-center text-muted">No incidents match these filters.</p>}
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