// Shows exactly why an incident got its severity score
export default function ScoreBreakdown({ breakdown = [], total }) {
  if (!breakdown.length) return null;
  const max = Math.max(...breakdown.map((b) => b.points), 1);

  return (
    <div className="space-y-2">
      {breakdown.map((item) => (
        <div key={item.factor}>
          <div className="flex justify-between text-xs">
            <span className="text-muted">{item.label}</span>
            <span className="font-semibold">+{item.points}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-navy-800">
            <div className="h-1.5 rounded-full bg-accent" style={{ width: `${(item.points / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {total !== undefined && (
        <div className="flex justify-between border-t border-navy-700 pt-2 text-sm font-bold">
          <span>Total score</span>
          <span>{total} / 100</span>
        </div>
      )}
    </div>
  );
}