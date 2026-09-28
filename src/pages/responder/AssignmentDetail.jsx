import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Check, X, Navigation, MapPin, Activity, CheckCircle2,
  Radio, AlertTriangle, Users, Brain,
} from 'lucide-react';
import { incidentApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import useIncident from '../../hooks/useIncident';
import useWatchPosition from '../../hooks/useWatchPosition';
import LiveTrackingMap from '../../components/map/LiveTrackingMap';
import ReportMedia from '../../components/incident/ReportMedia';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { CategoryLabel, SeverityBadge, DemoTag } from '../../components/Badges';
import { ASSIGNMENT_STATUS_LABELS, RESPONDER_TYPE_LABELS } from '../../utils/constants';
import { formatDistance, formatEta, fromPoint, timeAgo } from '../../utils/format';
import { navigationUrl } from '../../utils/links';

// One big "next step" button per stage keeps the responder's workload low
const NEXT_ACTION = {
  ACCEPTED: { status: 'ON_THE_WAY', label: "I'm on the way", icon: Navigation, className: 'bg-accent text-navy-950' },
  ON_THE_WAY: { status: 'ARRIVED', label: 'I have arrived', icon: MapPin, className: 'bg-high text-navy-950' },
  ARRIVED: { status: 'HANDLING', label: 'Start handling', icon: Activity, className: 'bg-medium text-navy-950' },
  HANDLING: { status: 'RESOLVED', label: 'Mark as resolved', icon: CheckCircle2, className: 'bg-success text-navy-950', confirm: true },
};

const WORKING = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'HANDLING'];

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { responder: me } = useAuth();
  const { data, loading, error, reload, responderPositions } = useIncident(id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [shareGps, setShareGps] = useState(false);

  // Latest assignment of this responder for this incident
  const mine = data?.assignments.find((a) => String(a.responder?._id) === String(me?._id));
  const gps = useWatchPosition(Boolean(shareGps && mine && WORKING.includes(mine.status)));

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    setActionError('');
    try {
      await incidentApi.decline(id);
      navigate('/responder', { replace: true });
    } catch (err) {
      setActionError(getErrorMessage(err));
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading assignment..." />;

  if (error || !data || !mine) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Assignment not found"
        text={error || 'You are not assigned to this incident.'}
        action={<Link to="/responder" className="font-semibold text-accent">Back to home</Link>}
      />
    );
  }

  const { incident, reports } = data;
  const incidentPosition = fromPoint(incident.location);
  const live = responderPositions[me._id];
  const myPosition = gps.position
    || (live ? { latitude: live.latitude, longitude: live.longitude } : fromPoint(mine.responder?.location));
  const distanceKm = live?.distanceKm ?? mine.distanceKm;
  const etaMinutes = live?.etaMinutes ?? mine.etaMinutes;

  const ai = incident.aiAnalysis || {};
  const descriptions = reports.map((r) => r.description).filter(Boolean);
  const media = reports.flatMap((r) => r.media || []);
  const next = NEXT_ACTION[mine.status];
  const finished = ['COMPLETED', 'DECLINED', 'CANCELLED'].includes(mine.status);

  return (
    <div className="space-y-4">
      <Link to="/responder" className="inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Home
      </Link>

      <section className="rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">
              <CategoryLabel category={incident.category} />
            </p>
            <p className="text-sm text-muted">
              {incident.referenceId} · assigned {timeAgo(mine.assignedAt)}
            </p>
          </div>
          <SeverityBadge severity={incident.severity} size="lg" />
        </div>

        {incident.address && (
          <p className="mt-3 flex items-center gap-1.5 text-sm">
            <MapPin size={15} className="text-muted" /> {incident.address}
          </p>
        )}

        {!finished && distanceKm != null && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-navy-950 p-3 text-center">
              <p className="text-xs text-muted">Distance</p>
              <p className="text-xl font-bold">{formatDistance(distanceKm)}</p>
            </div>
            <div className="rounded-lg bg-navy-950 p-3 text-center">
              <p className="text-xs text-muted">ETA</p>
              <p className="text-xl font-bold text-accent">{formatEta(etaMinutes)}</p>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium text-accent">{ASSIGNMENT_STATUS_LABELS[mine.status]}</span>
          {incident.isDemo && <DemoTag />}
        </div>
      </section>

      {actionError && (
        <p className="rounded-lg border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">
          {actionError}
        </p>
      )}

      {/* Primary action */}
      {mine.status === 'ASSIGNED' && (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => run(() => incidentApi.accept(id))}
            disabled={busy}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-success py-4 text-lg font-extrabold text-navy-950 disabled:opacity-60"
          >
            <Check size={22} /> Accept
          </button>
          <button
            type="button"
            onClick={decline}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-critical/50 py-4 font-bold text-critical disabled:opacity-60"
          >
            <X size={18} /> Decline
          </button>
        </div>
      )}

      {next && !confirming && (
        <button
          type="button"
          onClick={() => (next.confirm ? setConfirming(true) : run(() => incidentApi.updateStatus(id, { status: next.status })))}
          disabled={busy}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-extrabold disabled:opacity-60 ${next.className}`}
        >
          <next.icon size={22} /> {busy ? 'Updating...' : next.label}
        </button>
      )}

      {next?.confirm && confirming && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4">
          <p className="font-semibold">Is the emergency fully handled?</p>
          <p className="mt-1 text-sm text-muted">This will close the incident for all responders.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => run(() => incidentApi.updateStatus(id, { status: 'RESOLVED' }))}
              disabled={busy}
              className="rounded-lg bg-success py-3 font-bold text-navy-950 disabled:opacity-60"
            >
              Yes, resolved
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-navy-700 py-3 font-semibold"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {finished && (
        <div className="rounded-xl border border-navy-700 bg-navy-900 p-4 text-center text-sm text-muted">
          This assignment is {ASSIGNMENT_STATUS_LABELS[mine.status].toLowerCase()}.
        </div>
      )}

      {/* Navigation and live location */}
      {WORKING.includes(mine.status) && (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={navigationUrl(incidentPosition)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/50 py-3 text-sm font-semibold text-accent"
          >
            <Navigation size={16} /> Navigate
          </a>
          <button
            type="button"
            onClick={() => setShareGps((v) => !v)}
            aria-pressed={shareGps}
            className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold ${
              shareGps ? 'bg-accent/15 text-accent' : 'border border-navy-700 text-muted'
            }`}
          >
            <Radio size={16} /> {shareGps ? 'Sharing GPS' : 'Share live GPS'}
          </button>
        </div>
      )}
      {shareGps && gps.error && <p className="text-sm text-high">{gps.error}</p>}

      <LiveTrackingMap
        incident={{ position: incidentPosition, severity: incident.severity, resolved: finished }}
        responders={
          WORKING.includes(mine.status) && myPosition
            ? [{ id: me._id, name: 'You', type: me.type, position: myPosition, etaMinutes }]
            : []
        }
      />

      {/* Key information */}
      <section className="space-y-3 rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Brain size={18} className="text-accent" /> Key information
        </h2>

        {ai.reason && <p className="text-sm text-muted">{ai.reason}</p>}

        {ai.requiredResources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ai.requiredResources.map((r) => (
              <span
                key={r}
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  r === me.type ? 'bg-accent text-navy-950' : 'bg-navy-700 text-muted'
                }`}
              >
                {RESPONDER_TYPE_LABELS[r] || r}
              </span>
            ))}
          </div>
        )}

        {incident.reportCount > 1 && (
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <Users size={14} /> {incident.reportCount} people reported this emergency
          </p>
        )}

        {descriptions.length > 0 && (
          <ul className="space-y-2">
            {descriptions.map((d, i) => (
              <li key={i} className="rounded-lg bg-navy-950 p-3 text-sm">“{d}”</li>
            ))}
          </ul>
        )}

        <ReportMedia media={media} />
      </section>
    </div>
  );
}