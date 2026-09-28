import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { CategoryLabel, SeverityBadge, DemoTag } from '../Badges';
import { ASSIGNMENT_STATUS_LABELS } from '../../utils/constants';
import { formatDistance, formatEta, timeAgo } from '../../utils/format';

// One assignment as seen by a responder
export default function AssignmentCard({ assignment }) {
  const incident = assignment.incident;
  if (!incident) return null;

  const isNew = assignment.status === 'ASSIGNED';
  const finished = ['COMPLETED', 'DECLINED', 'CANCELLED'].includes(assignment.status);

  return (
    <Link
      to={`/responder/assignments/${incident._id}`}
      className={`block rounded-xl border p-4 transition ${
        isNew ? 'border-critical/60 bg-critical/10' : 'border-navy-700 bg-navy-900 hover:border-accent/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isNew && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-critical">New assignment</p>}
          <p className="font-semibold">
            <CategoryLabel category={incident.category} />
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {incident.referenceId} · {timeAgo(assignment.assignedAt)}
          </p>
        </div>
        <SeverityBadge severity={incident.severity} resolved={finished && assignment.status === 'COMPLETED'} />
      </div>

      {incident.address && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin size={14} /> {incident.address}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={finished ? 'text-muted' : 'font-medium text-accent'}>
          {ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}
        </span>
        <span className="flex items-center gap-2 text-muted">
          {!finished && assignment.distanceKm != null && (
            <span>
              {formatDistance(assignment.distanceKm)} · {formatEta(assignment.etaMinutes)}
            </span>
          )}
          {assignment.isDemo && <DemoTag />}
        </span>
      </div>
    </Link>
  );
}