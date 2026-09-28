import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Siren, FileText, Phone } from 'lucide-react';
import { incidentApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../context/SocketContext';
import { EMERGENCY_NUMBERS } from '../../utils/constants';
import EmergencyCallBanner from '../../components/EmergencyCallBanner';
import IncidentCard from '../../components/incident/IncidentCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';

export default function CitizenHome() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await incidentApi.list({ limit: 3 });
      setItems(data.items);
    } catch {
      // Recent activity is optional; the page still works without it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Any new notification may mean one of my incidents changed
  useSocketEvent('notification.new', load);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted">Hello,</p>
        <h1 className="text-2xl font-bold">{user.name}</h1>
      </div>

      <Link
        to="/citizen/report"
        className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-critical py-10 text-white shadow-lg shadow-critical/20 transition active:scale-[0.99]"
      >
        <Siren size={44} />
        <span className="text-2xl font-extrabold">Report Emergency</span>
        <span className="text-sm text-white/80">Takes less than a minute</span>
      </Link>

      <EmergencyCallBanner />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Activity</h2>
          <Link to="/citizen/reports" className="text-sm font-semibold text-accent">View all</Link>
        </div>
        {loading && <Spinner />}
        {!loading && !items.length && (
          <EmptyState icon={FileText} title="No reports yet" text="Emergencies you report will appear here." />
        )}
        <div className="space-y-2">
          {items.map((incident) => (
            <IncidentCard key={incident._id} incident={incident} to={`/citizen/track/${incident._id}`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Nearby Help</h2>
        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_NUMBERS.map((n) => (
            <a
              key={n.number}
              href={`tel:${n.number}`}
              className="flex items-center justify-between rounded-xl border border-navy-700 bg-navy-900 p-3"
            >
              <span>
                <span className="block text-xs text-muted">{n.label}</span>
                <span className="text-lg font-bold">{n.number}</span>
              </span>
              <Phone size={18} className="text-accent" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}