import { Check } from 'lucide-react';
import { STATUS_LABELS } from '../../utils/constants';
import { formatTime } from '../../utils/format';

const DEFAULT_STEPS = [
  'REPORTED', 'AI_ANALYSIS', 'VERIFIED', 'ASSIGNED', 'ACCEPTED',
  'ON_THE_WAY', 'ARRIVED', 'HANDLING', 'RESOLVED',
];

const FINAL_STEPS = ['RESOLVED', 'CLOSED'];

export default function StatusTimeline({ status, history = [], steps = DEFAULT_STEPS }) {
  // When CLOSED is not shown, treat it as RESOLVED
  const normalized = status === 'CLOSED' && !steps.includes('CLOSED') ? 'RESOLVED' : status;
  const currentIndex = steps.indexOf(normalized);

  const timeFor = (step) => {
    const entries = history.filter((h) => h.status === step);
    return entries.length ? entries[entries.length - 1].at : null;
  };

  return (
    <ol aria-label="Incident progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isFinal = FINAL_STEPS.includes(step);
        const done = index < currentIndex || (index === currentIndex && isFinal);
        const current = index === currentIndex && !isFinal;
        const at = timeFor(step);

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                  done
                    ? 'border-success bg-success text-navy-950'
                    : current
                      ? 'border-accent bg-accent/20'
                      : 'border-navy-700 bg-navy-900'
                }`}
              >
                {done && <Check size={14} strokeWidth={3} />}
                {current && <span className="h-2 w-2 rounded-full bg-accent" />}
              </span>
              {!isLast && <span className={`w-0.5 flex-1 ${done ? 'bg-success/60' : 'bg-navy-700'}`} />}
            </div>
            <div className={`pb-4 ${isLast ? '' : 'min-h-10'}`}>
              <p className={`text-sm font-medium ${done || current ? 'text-fg' : 'text-muted'}`}>
                {STATUS_LABELS[step]}
                {current && <span className="ml-2 text-xs text-accent">(current)</span>}
              </p>
              {at && (done || current) && <p className="text-xs text-muted">{formatTime(at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}