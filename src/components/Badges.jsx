import { SEVERITY_META, RESOLVED_META, STATUS_LABELS, CATEGORY_META } from '../utils/constants';

export function SeverityBadge({ severity, resolved = false, size = 'sm' }) {
  const meta = resolved ? RESOLVED_META : SEVERITY_META[severity] || SEVERITY_META.LOW;
  const sizing = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-semibold ${meta.bg} ${meta.text} ${meta.border} ${sizing}`}
    >
      <span aria-hidden="true">{meta.symbol}</span>
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const done = status === 'RESOLVED' || status === 'CLOSED';
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        done ? 'bg-success/15 text-success' : 'bg-accent/10 text-accent'
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function CategoryLabel({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.OTHER;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

export function DemoTag() {
  return (
    <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
      Simulated
    </span>
  );
}