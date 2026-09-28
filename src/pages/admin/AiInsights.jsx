import { useCallback, useEffect, useState } from 'react';
import { Brain, AlertTriangle, MapPin, Timer, GitMerge, Info, PieChart } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import Spinner from '../../components/Spinner';

const RANGES = [7, 14, 30];

const INSIGHT_ICONS = {
  CATEGORY: PieChart,
  SEVERITY: AlertTriangle,
  HOTSPOT: MapPin,
  RESPONSE: Timer,
  DUPLICATES: GitMerge,
  AI: Brain,
  INFO: Info,
};

export default function AiInsights() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await dashboardApi.aiInsights(days));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const m = data?.metrics;
  const metricCards = m
    ? [
        { label: 'Incidents analyzed', value: m.analyzed },
        { label: 'Average AI confidence', value: `${m.averageConfidence}%` },
        { label: 'Analyzed by LLM', value: m.llmAnalyzed },
        { label: 'Admin overrides', value: m.overridden },
        { label: 'Incidents with duplicates', value: m.mergedIncidents },
        { label: 'Duplicate reports merged', value: m.extraReports },
      ]
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Insights</h1>
          <p className="text-sm text-muted">What the historical data says</p>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-navy-900 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              aria-pressed={days === r}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${days === r ? 'bg-navy-700 text-fg' : 'text-muted'}`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}
      {loading && !data && <Spinner label="Generating insights..." />}

      {metricCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metricCards.map((c) => (
            <div key={c.label} className="rounded-xl border border-navy-700 bg-navy-900 p-4">
              <p className="text-xs text-muted">{c.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {data && (
        <section className="space-y-3 rounded-2xl border border-navy-700 bg-navy-900 p-5">
          <h2 className="font-semibold">Insights</h2>
          <ul className="space-y-2">
            {data.insights.map((insight, i) => {
              const Icon = INSIGHT_ICONS[insight.type] || Info;
              return (
                <li key={i} className="flex gap-3 rounded-lg bg-navy-950 p-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-sm">{insight.message}</p>
                </li>
              );
            })}
          </ul>
          {data.note && (
            <p className="flex items-start gap-2 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0" /> {data.note}
            </p>
          )}
        </section>
      )}
    </div>
  );
}