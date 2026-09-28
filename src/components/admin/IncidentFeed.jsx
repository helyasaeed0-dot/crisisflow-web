import { Inbox, Users } from 'lucide-react';
import { CategoryLabel, SeverityBadge, StatusBadge, DemoTag } from '../Badges';
import EmptyState from '../EmptyState';
import { timeAgo } from '../../utils/format';

export default function IncidentFeed({ incidents = [], selectedId, onSelect, title = 'Active Incidents' }) {
  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900">
      <div className="flex items-center justify-between border-b border-navy-700 px-4 py-3">
        <h2 className="font-semibold">{title}</h2>
        <span className="rounded-md bg-navy-800 px-2 py-0.5 text-xs font-semibold">{incidents.length}</span>
      </div>

      {!incidents.length ? (
        <div className="p-4">
          <EmptyState icon={Inbox} title="No active incidents" text="New emergencies will appear here instantly." />
        </div>
      ) : (
        <ul className="max-h-[560px] divide-y divide-navy-700 overflow-y-auto">
          {incidents.map((i) => {
            const analyzing = ['REPORTED', 'AI_ANALYSIS'].includes(i.status);
            return (
              <li key={i._id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(i._id)}
                  className={`w-full px-4 py-3 text-left transition hover:bg-navy-800 ${
                    i._id === selectedId ? 'bg-navy-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">
                      <CategoryLabel category={i.category} />
                    </p>
                    {analyzing ? (
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent">Analyzing…</span>
                    ) : (
                      <SeverityBadge severity={i.severity} resolved={['RESOLVED', 'CLOSED'].includes(i.status)} />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {i.referenceId} · {i.address || 'No address'} · {timeAgo(i.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={i.status} />
                    {i.needsReview && (
                      <span className="rounded-md bg-high/15 px-2 py-0.5 text-xs font-semibold text-high">Needs review</span>
                    )}
                    {i.reportCount > 1 && (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Users size={12} /> {i.reportCount}
                      </span>
                    )}
                    {i.isDemo && <DemoTag />}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}