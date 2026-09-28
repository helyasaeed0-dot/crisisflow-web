import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Brain, Users, AlertTriangle, ChevronLeft } from 'lucide-react';
import useIncident from '../../hooks/useIncident';
import LiveTrackingMap from '../../components/map/LiveTrackingMap';
import StatusTimeline from '../../components/incident/StatusTimeline';
import ReportMedia from '../../components/incident/ReportMedia';
import EmergencyCallBanner from '../../components/EmergencyCallBanner';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { CategoryLabel, SeverityBadge, StatusBadge, DemoTag } from '../../components/Badges';
import { RESPONDER_TYPE_LABELS, STATUS_LABELS } from '../../utils/constants';
import { formatDateTime, formatDistance, formatEta, fromPoint } from '../../utils/format';

const EN_ROUTE = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'HANDLING'];

export default function TrackIncident() {
  const { id } = useParams();
  const { state } = useLocation();
  const { data, loading, error, responderPositions } = useIncident(id);
  const [copied, setCopied] = useState(false);

  if (loading) return <Spinner label="Loading your report..." />;

  if (error || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Report not found"
        text={error || 'This report does not exist or you cannot view it.'}
        action={<Link to="/citizen/reports" className="font-semibold text-accent">Back to my reports</Link>}
      />
    );
  }

  const { incident, reports, assignments } = data;
  const analyzing = ['REPORTED', 'AI_ANALYSIS'].includes(incident.status);
  const resolved = ['RESOLVED', 'CLOSED'].includes(incident.status);
  const ai = incident.aiAnalysis || {};

  // Merge the last known position with live socket updates
  const responders = assignments
    .filter((a) => !['DECLINED', 'CANCELLED'].includes(a.status))
    .map((a) => {
      const live = responderPositions[a.responder?._id];
      return {
        id: a.responder?._id,
        name: a.responder?.user?.name || 'Responder',
        type: a.responder?.type,
        status: a.status,
        position: live ? { latitude: live.latitude, longitude: live.longitude } : fromPoint(a.responder?.location),
        etaMinutes: live?.etaMinutes ?? a.etaMinutes,
        distanceKm: live?.distanceKm ?? a.distanceKm,
      };
    });

  const onMap = responders.filter((r) => EN_ROUTE.includes(r.status));
  const media = reports.flatMap((r) => r.media || []);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(incident.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the ID is still visible on screen
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/citizen/reports" className="inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> My reports
      </Link>

      {state?.justReported && (
        <div className="flex gap-3 rounded-xl border border-success/40 bg-success/10 p-4">
          <CheckCircle2 className="shrink-0 text-success" />
          <div>
            <p className="font-semibold">Report received</p>
            <p className="text-sm text-muted">
              {state.merged
                ? 'Others have already reported this emergency. Your report was added as extra evidence.'
                : 'Your emergency has been sent to the command center.'}
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">
              <CategoryLabel category={incident.category} />
            </p>
            <button type="button" onClick={copyReference} className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
              {incident.referenceId} <Copy size={13} /> {copied && <span className="text-success">Copied</span>}
            </button>
          </div>
          {!analyzing && <SeverityBadge severity={incident.severity} resolved={resolved} size="lg" />}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={incident.status} />
          {incident.isDemo && <DemoTag />}
        </div>
        <p className="mt-3 text-sm text-muted">
          {incident.address ? `${incident.address} · ` : ''}
          {formatDateTime(incident.createdAt)}
        </p>
      </section>

      <section className="rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <h2 className="mb-2 flex items-center gap-2 font-semibold">
          <Brain size={18} className="text-accent" /> AI Analysis
        </h2>
        {analyzing ? (
          <Spinner label="AI is analyzing your report..." />
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              Priority: <span className="font-semibold">{incident.severity}</span>
              {typeof ai.confidence === 'number' && (
                <span className="text-muted"> · {Math.round(ai.confidence * 100)}% confidence</span>
              )}
            </p>
            {ai.reason && <p className="text-muted">{ai.reason}</p>}
            {ai.requiredResources?.length > 0 && (
              <p>
                Help needed:{' '}
                <span className="font-semibold">
                  {ai.requiredResources.map((r) => RESPONDER_TYPE_LABELS[r] || r).join(', ')}
                </span>
              </p>
            )}
            {incident.reportCount > 1 && (
              <p className="flex items-center gap-1.5 text-muted">
                <Users size={14} /> {incident.reportCount} people reported this emergency
              </p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <LiveTrackingMap
          incident={{ position: fromPoint(incident.location), severity: incident.severity, resolved }}
          responders={onMap}
        />

        {responders.length === 0 && !resolved && (
          <p className="text-sm text-muted">Waiting for a responder to be assigned...</p>
        )}

        {responders.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-navy-700 bg-navy-900 p-3">
            <div>
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted">
                {RESPONDER_TYPE_LABELS[r.type] || r.type} · {STATUS_LABELS[r.status] || r.status}
              </p>
            </div>
            {['ACCEPTED', 'ON_THE_WAY'].includes(r.status) && r.etaMinutes != null && (
              <div className="text-right">
                <p className="font-bold text-accent">{formatEta(r.etaMinutes)}</p>
                <p className="text-xs text-muted">{formatDistance(r.distanceKm)} away</p>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-navy-700 bg-navy-900 p-4">
        <h2 className="mb-3 font-semibold">Progress</h2>
        <StatusTimeline status={incident.status} history={incident.statusHistory} />
      </section>

      {media.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Your attachments</h2>
          <ReportMedia media={media} />
        </section>
      )}

      {!resolved && <EmergencyCallBanner />}
    </div>
  );
}