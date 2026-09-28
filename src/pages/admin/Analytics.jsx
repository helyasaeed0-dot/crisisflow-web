import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import { CircleMarker, Tooltip as MapTooltip } from 'react-leaflet';
import { Info } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import BaseMap, { FitBounds } from '../../components/map/BaseMap';
import Spinner from '../../components/Spinner';
import { CATEGORY_META, SEVERITY_META, STATUS_LABELS } from '../../utils/constants';
import { toLatLng } from '../../utils/format';

const RANGES = [7, 14, 30];

// Dark theme for Recharts
const tooltipProps = {
  contentStyle: { background: '#111C2E', border: '1px solid #24334F', borderRadius: 8, color: '#F8FAFC' },
  labelStyle: { color: '#94A3B8' },
  cursor: { fill: 'rgba(36, 51, 79, 0.4)' },
};
const axisProps = { tick: { fill: '#94A3B8', fontSize: 12 }, stroke: '#24334F' };

const HOTSPOT_COLORS = { HIGH: '#E53935', MEDIUM: '#F59E0B', LOW: '#F4C430' };

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-navy-700 bg-navy-900 p-4 ${className}`}>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value ?? '—'}</p>
    </div>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [hotspots, setHotspots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, h] = await Promise.all([dashboardApi.analytics(days), dashboardApi.hotspots(Math.max(days, 30))]);
      setAnalytics(a);
      setHotspots(h);
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

  const trend = (analytics?.dailyTrend || []).map((d) => ({ ...d, label: d.date.slice(5) }));
  const categories = (analytics?.byCategory || [])
    .filter((c) => c.count > 0)
    .map((c) => ({ ...c, label: CATEGORY_META[c.key]?.label || c.key }));
  const severities = (analytics?.bySeverity || []).map((s) => ({
    ...s,
    label: SEVERITY_META[s.key]?.label || s.key,
    color: SEVERITY_META[s.key]?.hex || '#94A3B8',
  }));
  const statuses = (analytics?.activeByStatus || [])
    .filter((s) => s.count > 0)
    .map((s) => ({ ...s, label: STATUS_LABELS[s.key] || s.key }));

  const spots = hotspots?.hotspots || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
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
      {loading && !analytics && <Spinner label="Loading analytics..." />}

      {analytics && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Total incidents" value={analytics.totalIncidents} />
            <Stat label="Resolved" value={analytics.resolvedIncidents} />
            <Stat label="Resolution rate" value={analytics.resolutionRate != null ? `${analytics.resolutionRate}%` : '—'} />
            <Stat
              label="Avg response time"
              value={analytics.averageResponseTimeMinutes != null ? `${analytics.averageResponseTimeMinutes} min` : '—'}
            />
          </div>

          <Card title="Emergency volume per day">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trend}>
                <CartesianGrid stroke="#24334F" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis allowDecimals={false} {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                <Bar dataKey="total" name="All incidents" fill="#18C8E8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" name="Critical" fill="#E53935" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="By category">
              {categories.length ? (
                <ResponsiveContainer width="100%" height={Math.max(160, categories.length * 40)}>
                  <BarChart data={categories} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#24334F" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} {...axisProps} />
                    <YAxis type="category" dataKey="label" width={130} {...axisProps} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="count" name="Incidents" fill="#18C8E8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted">No incidents in this period.</p>
              )}
            </Card>

            <Card title="By severity">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={severities}>
                  <CartesianGrid stroke="#24334F" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                    {severities.map((s) => (
                      <Cell key={s.key} fill={s.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Active incidents by stage">
            {statuses.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statuses}>
                  <CartesianGrid stroke="#24334F" vertical={false} />
                  <XAxis dataKey="label" {...axisProps} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="count" name="Incidents" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted">No active incidents right now.</p>
            )}
          </Card>
        </>
      )}

      {hotspots && (
        <Card title={`Geographic hotspots (last ${hotspots.windowDays} days)`}>
          <p className="mb-3 flex items-start gap-2 text-xs text-muted">
            <Info size={14} className="mt-0.5 shrink-0" /> {hotspots.note}
          </p>
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <BaseMap center={spots[0] ? toLatLng(spots[0].position) : undefined} zoom={12} className="h-80">
              {spots.map((s, i) => (
                <CircleMarker
                  key={i}
                  center={toLatLng(s.position)}
                  radius={8 + s.intensity * 22}
                  pathOptions={{ color: HOTSPOT_COLORS[s.level], fillColor: HOTSPOT_COLORS[s.level], fillOpacity: 0.35, weight: 2 }}
                >
                  <MapTooltip>
                    {s.count} report(s) · mostly {CATEGORY_META[s.topCategory]?.label || s.topCategory}
                  </MapTooltip>
                </CircleMarker>
              ))}
              <FitBounds points={spots.map((s) => toLatLng(s.position))} />
            </BaseMap>

            <ol className="max-h-80 space-y-2 overflow-y-auto">
              {spots.map((s, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-navy-950 p-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      #{i + 1} {CATEGORY_META[s.topCategory]?.label || s.topCategory}
                    </p>
                    <p className="text-xs text-muted">
                      {s.count} report(s){s.critical ? ` · ${s.critical} critical` : ''}
                    </p>
                  </div>
                  <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ color: HOTSPOT_COLORS[s.level] }}>
                    {s.level}
                  </span>
                </li>
              ))}
              {!spots.length && <li className="text-sm text-muted">Not enough data yet.</li>}
            </ol>
          </div>
        </Card>
      )}
    </div>
  );
}