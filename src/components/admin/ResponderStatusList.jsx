import { RESPONDER_TYPE_LABELS } from '../../utils/constants';

const ORDER = { BUSY: 0, AVAILABLE: 1, OFFLINE: 2 };

export default function ResponderStatusList({ responders = [] }) {
  const available = responders.filter((r) => r.availability === 'AVAILABLE').length;
  const busy = responders.filter((r) => r.availability === 'BUSY').length;
  const sorted = [...responders].sort((a, b) => (ORDER[a.availability] ?? 3) - (ORDER[b.availability] ?? 3));

  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900">
      <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
        <h2 className="font-semibold">Responder Status</h2>
        <p className="text-xs text-muted">
          <span className="text-success">{available} available</span> · <span className="text-high">{busy} busy</span>
        </p>
      </div>
      <ul className="grid max-h-64 gap-px overflow-y-auto bg-navy-700 sm:grid-cols-2">
        {sorted.map((r) => (
          <li key={r._id} className="flex items-center justify-between bg-navy-900 px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{r.name || 'Responder'}</p>
              <p className="text-xs text-muted">{RESPONDER_TYPE_LABELS[r.type] || r.type}</p>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                r.availability === 'BUSY' ? 'bg-high/15 text-high' : 'bg-success/15 text-success'
              }`}
            >
              {r.availability === 'BUSY' ? 'Busy' : 'Available'}
            </span>
          </li>
        ))}
        {!sorted.length && <li className="bg-navy-900 px-4 py-4 text-sm text-muted">No responders online.</li>}
      </ul>
    </section>
  );
}