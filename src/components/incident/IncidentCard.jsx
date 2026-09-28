import { Link } from 'react-router-dom';
import { CategoryLabel, SeverityBadge, StatusBadge, DemoTag } from '../Badges';
import { timeAgo } from '../../utils/format';

export default function IncidentCard({ incident, to }) {
  const resolved = ['RESOLVED', 'CLOSED'].includes(incident.status);
  const analyzing = ['REPORTED', 'AI_ANALYSIS'].includes(incident.status);

  return (
    <Link
      to={to}
      className="block rounded-xl border border-navy-700 bg-navy-900 p-4 transition hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            <CategoryLabel category={incident.category} />
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {incident.referenceId} · {timeAgo(incident.createdAt)}
          </p>
        </div>
        {analyzing ? (
          <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Analyzing…</span>
        ) : (
          <SeverityBadge severity={incident.severity} resolved={resolved} />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <StatusBadge status={incident.status} />
        <span className="flex items-center gap-2 text-xs text-muted">
          {incident.reportCount > 1 && <span>{incident.reportCount} reports</span>}
          {incident.isDemo && <DemoTag />}
        </span>
      </div>
    </Link>
  );
}