export default function Spinner({ label = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex items-center gap-3 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-700 border-t-accent" />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (!fullScreen) return content;
  return <div className="grid min-h-full place-items-center">{content}</div>;
}