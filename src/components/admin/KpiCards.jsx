import { useCallback, useEffect, useRef, useState } from 'react';
import { Siren, AlertTriangle, Ambulance, CheckCircle2, Timer } from 'lucide-react';
import { dashboardApi } from '../../api/endpoints';
import { useSocketEvent } from '../../context/SocketContext';

export default function KpiCards() {
  const [stats, setStats] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      setStats(await dashboardApi.statistics());
    } catch {
      // Keep the last values if a refresh fails
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer.current);
    };
  }, [load]);

  // Refresh shortly after any live change
  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(load, 1000);
  };
  useSocketEvent('incident.created', schedule);
  useSocketEvent('incident.updated', schedule);
  useSocketEvent('incident.assigned', schedule);
  useSocketEvent('incident.resolved', schedule);
  useSocketEvent('demo.reset', schedule);

  const cards = [
    { label: 'Active Emergencies', value: stats?.activeEmergencies, icon: Siren, tone: 'text-fg' },
    {
      label: 'Critical',
      value: stats?.critical,
      icon: AlertTriangle,
      tone: 'text-critical',
      sub: stats?.needsReview ? `${stats.needsReview} need review` : 'None waiting for review',
    },
    {
      label: 'Responders Online',
      value: stats?.responders.online,
      icon: Ambulance,
      tone: 'text-accent',
      sub: stats ? `${stats.responders.available} available · ${stats.responders.busy} busy` : null,
    },
    {
      label: 'Resolved Today',
      value: stats?.resolvedToday,
      icon: CheckCircle2,
      tone: 'text-success',
      sub: stats ? `${stats.reportedToday} reported today` : null,
    },
    {
      label: 'Avg Response Time',
      value: stats?.averageResponseTimeMinutes != null ? `${stats.averageResponseTimeMinutes} min` : '—',
      icon: Timer,
      tone: 'text-high',
      sub: 'Report to arrival, last 7 days',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, tone, sub }) => (
        <div key={label} className="rounded-xl border border-navy-700 bg-navy-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">{label}</p>
            <Icon size={16} className={tone} />
          </div>
          <p className={`mt-2 text-3xl font-extrabold ${tone}`}>{value ?? '—'}</p>
          {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
        </div>
      ))}
    </div>
  );
}