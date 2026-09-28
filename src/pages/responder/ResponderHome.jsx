import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Inbox, Power, Clock } from 'lucide-react';
import { responderApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocketEvent } from '../../context/SocketContext';
import useGeolocation from '../../hooks/useGeolocation';
import AssignmentCard from '../../components/incident/AssignmentCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { RESPONDER_TYPE_LABELS } from '../../utils/constants';
import { timeAgo } from '../../utils/format';

const AVAILABILITY_STYLES = {
  AVAILABLE: { label: 'Available', dot: 'bg-success', text: 'text-success' },
  BUSY: { label: 'Busy - on assignment', dot: 'bg-high', text: 'text-high' },
  OFFLINE: { label: 'Offline', dot: 'bg-muted', text: 'text-muted' },
};

export default function ResponderHome() {
  const { user, setResponder } = useAuth();
  const geo = useGeolocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await responderApi.me();
      setProfile(data);
      setResponder(data.responder);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [setResponder]);

  useEffect(() => {
    load();
  }, [load]);

  // New assignments and updates arrive live
  useSocketEvent('incident.assigned', load);
  useSocketEvent('notification.new', load);

  // Send the GPS position once the browser returns it
  useEffect(() => {
    if (!geo.position) return;
    (async () => {
      try {
        const data = await responderApi.updateStatus({
          latitude: geo.position.latitude,
          longitude: geo.position.longitude,
        });
        setProfile((p) => (p ? { ...p, responder: data.responder } : p));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    })();
  }, [geo.position]);

  const setAvailability = async (availability) => {
    setSaving(true);
    setError('');
    try {
      const data = await responderApi.updateStatus({ availability });
      setProfile((p) => ({ ...p, responder: data.responder }));
      setResponder(data.responder);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading your profile..." />;
  if (!profile) return <p className="text-critical">{error || 'Could not load your profile.'}</p>;

  const { responder, activeAssignments } = profile;
  const availability = AVAILABILITY_STYLES[responder.availability] || AVAILABILITY_STYLES.OFFLINE;
  const isBusy = responder.availability === 'BUSY';
  const pending = activeAssignments.filter((a) => a.status === 'ASSIGNED');
  const ongoing = activeAssignments.filter((a) => a.status !== 'ASSIGNED');

  return (
    <div className="space-y-5">
      <div>
        <p className="text-muted">{RESPONDER_TYPE_LABELS[responder.type] || responder.type}</p>
        <h1 className="text-2xl font-bold">{user.name}</h1>
      </div>

      {responder.verificationStatus !== 'VERIFIED' && (
        <div className="flex gap-3 rounded-xl border border-high/40 bg-high/10 p-4">
          <ShieldAlert className="shrink-0 text-high" />
          <p className="text-sm">
            {responder.verificationStatus === 'REJECTED'
              ? 'Your responder account was not approved. Please contact the command center.'
              : 'Your account is waiting for admin verification. You will receive assignments after approval.'}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-critical" role="alert">{error}</p>}

      <section className="rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Availability</h2>
          <span className={`flex items-center gap-2 text-sm font-semibold ${availability.text}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${availability.dot}`} />
            {availability.label}
          </span>
        </div>

        {isBusy ? (
          <p className="text-sm text-muted">You will be available again when your current assignment ends.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving || responder.availability === 'AVAILABLE'}
              onClick={() => setAvailability('AVAILABLE')}
              className={`rounded-xl py-3 font-bold ${
                responder.availability === 'AVAILABLE' ? 'bg-success text-navy-950' : 'border border-navy-700 text-muted'
              }`}
            >
              Available
            </button>
            <button
              type="button"
              disabled={saving || responder.availability === 'OFFLINE'}
              onClick={() => setAvailability('OFFLINE')}
              className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 font-bold ${
                responder.availability === 'OFFLINE' ? 'bg-navy-700 text-fg' : 'border border-navy-700 text-muted'
              }`}
            >
              <Power size={16} /> Offline
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">My location</h2>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Clock size={12} />
              {responder.lastLocationAt ? `Updated ${timeAgo(responder.lastLocationAt)}` : 'Not shared yet'}
            </p>
          </div>
          <button
            type="button"
            onClick={geo.request}
            disabled={geo.loading}
            className="inline-flex items-center gap-2 rounded-lg border border-accent/50 px-3 py-2 text-sm font-semibold text-accent disabled:opacity-60"
          >
            <Crosshair size={16} />
            {geo.loading ? 'Locating...' : 'Update'}
          </button>
        </div>
        {geo.error && <p className="mt-2 text-sm text-high">{geo.error}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Assignments</h2>

        {!activeAssignments.length && (
          <EmptyState
            icon={Inbox}
            title="No active assignments"
            text={
              responder.availability === 'AVAILABLE'
                ? 'Stay available. New emergencies will appear here instantly.'
                : 'Switch to Available to receive emergencies.'
            }
          />
        )}

        {[...pending, ...ongoing].map((a) => (
          <AssignmentCard key={a._id} assignment={a} />
        ))}
      </section>
    </div>
  );
}