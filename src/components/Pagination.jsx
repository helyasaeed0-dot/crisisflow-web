import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) {
    return total !== undefined ? <p className="text-sm text-muted">{total} result(s)</p> : null;
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-navy-700 px-3 py-1.5 disabled:opacity-40"
      >
        <ChevronLeft size={14} /> Previous
      </button>
      <span className="text-muted">
        Page {page} of {pages}
        {total !== undefined && ` · ${total} total`}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-navy-700 px-3 py-1.5 disabled:opacity-40"
      >
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}