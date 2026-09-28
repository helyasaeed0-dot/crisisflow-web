export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-700 px-6 py-10 text-center">
      {Icon && <Icon className="mx-auto mb-3 text-muted" size={32} />}
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}