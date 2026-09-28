import { Phone } from 'lucide-react';

// Safety notice: the platform supports emergency services, it does not replace them
export default function EmergencyCallBanner() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-critical/30 bg-critical/10 px-4 py-3">
      <p className="text-sm">
        <span className="font-semibold">Life in danger?</span>{' '}
        <span className="text-muted">Call emergency services first.</span>
      </p>
      <div className="flex shrink-0 gap-2">
        <a href="tel:1122" className="inline-flex items-center gap-1 rounded-lg bg-critical px-3 py-1.5 text-sm font-bold text-white">
          <Phone size={14} /> 1122
        </a>
        <a href="tel:15" className="inline-flex items-center gap-1 rounded-lg border border-critical/40 px-3 py-1.5 text-sm font-bold text-critical">
          15
        </a>
      </div>
    </div>
  );
}