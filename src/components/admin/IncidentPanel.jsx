import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, Brain, ShieldCheck, RefreshCw, Users, MapPin, Clock, PlayCircle, CheckCircle2, Archive, Phone, ExternalLink,
} from 'lucide-react';
import { incidentApi, demoApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import useIncident from '../../hooks/useIncident';
import Spinner from '../Spinner';
import ScoreBreakdown from '../incident/ScoreBreakdown';
import StatusTimeline from '../incident/StatusTimeline';
import ReportMedia from '../incident/ReportMedia';
import LiveTrackingMap from '../map/LiveTrackingMap';
import RecommendationList from './RecommendationList';
import { CategoryLabel, SeverityBadge, StatusBadge, DemoTag } from '../Badges';
import {
  ASSIGNMENT_STATUS_LABELS, CATEGORY_META, RESPONDER_TYPE_LABELS, SEVERITY_META,
} from '../../utils/constants';
import { formatDateTime, formatEta, fromPoint, timeAgo } from '../../utils/format';

const ADMIN_STEPS = [
  'REPORTED', 'AI_ANALYSIS', 'VERIFIED', 'ASSIGNED', 'ACCEPTED',
  'ON_THE_WAY', 'ARRIVED', 'HANDLING', 'RESOLVED', 'CLOSED',
];
const WORKING = ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'HANDLING'];
const SIMULATABLE = ['ASSIGNED', 'ACCEPTED', 'ON_THE_WAY'];

function sourceLabel(source) {
  if (!source) return 'Not analyzed';
  if (source === 'rules') return 'Rules engine';
  if (source.startsWith('gemini')) return 'Gemini AI + rules';
  if (source.startsWith('anthropic')) return 'Claude AI + rules';
  return source;
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="space-y-3 border-t border-navy-700 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon size={16} className="text-accent" />} {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function IncidentPanel({ incidentId, onClose, showMap = false }) {
  const { data, loading, error, reload, responderPositions } = useIncident(incidentId);
  const [verifyForm, setVerifyForm] = useState({ severity: '', category: '', note: '' });
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setVerifyForm({ severity: '', category: '', note: '' });
    setActionError('');
    setMessage('');
  }, [incidentId]);

  const run = async (key, fn, successMessage) => {
    setBusy(key);
    setActionError('');
    setMessage('');
    try {
      await fn();
      if (successMessage) setMessage(successMessage);
      await reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const shell = (content) => (
    <div className="space-y-4 rounded-2xl border border-navy-700 bg-navy-900 p-4">{content}</div>
  );

  if (loading) return shell(<Spinner label="Loading incident..." />);
  if (error || !data) {
    return shell(
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-critical">{error || 'Incident not found'}</p>
        {onClose && <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>}
      </div>
    );
  }

  const { incident, reports, assignments } = data;
  const ai = incident.aiAnalysis || {};
  const analyzing = ['REPORTED', 'AI_ANALYSIS'].includes(incident.status);
  const closed = ['RESOLVED', 'CLOSED'].includes(incident.status);
  const visibleAssignments = assignments.filter((a) => a.status !== 'CANCELLED');
  const canSimulate = assignments.some((a) => SIMULATABLE.includes(a.status));

  const mapResponders = assignments
    .filter((a) => WORKING.includes(a.status))
    .map((a) => {
      const live = responderPositions[a.responder?._id];
      return {
        id: a.responder?._id,
        name: a.responder?.user?.name,
        type: a.responder?.type,
        position: live ? { latitude: live.latitude, longitude: live.longitude } : fromPoint(a.responder?.location),
        etaMinutes: live?.etaMinutes ?? a.etaMinutes,
      };
    });

  const verify = () =>
    run(
      'verify',
      () =>
        incidentApi.verify(incident._id, {
          ...(verifyForm.severity && { severity: verifyForm.severity }),
          ...(verifyForm.category && { category: verifyForm.category }),
          ...(verifyForm.note && { note: verifyForm.note }),
        }),
      'Incident verified'
    );

  const resolve = () => {
    if (!window.confirm('Mark this incident as resolved? All responders will be released.')) return;
    run('resolve', () => incidentApi.updateStatus(incident._id, { status: 'RESOLVED', note: 'Resolved by command center' }), 'Incident resolved');
  };

  const closeIncident = () =>
    run('close', () => incidentApi.updateStatus(incident._id, { status: 'CLOSED', note: 'Closed and audited' }), 'Incident closed');

  return shell(
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold">
            <CategoryLabel category={incident.category} />
          </p>
          <p className="text-sm text-muted">{incident.referenceId}</p>
        </div>
        <div className="flex items-center gap-2">
          {!analyzing && <SeverityBadge severity={incident.severity} resolved={closed} size="lg" />}
          {onClose && (
            <button type="button" onClick={onClose} className="text-muted hover:text-fg" aria-label="Close panel">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={incident.status} />
        {incident.needsReview && (
          <span className="rounded-md bg-high/15 px-2 py-0.5 text-xs font-semibold text-high">Needs review</span>
        )}
        {incident.verification?.overridden && (
          <span className="rounded-md bg-navy-700 px-2 py-0.5 text-xs">Admin override</span>
        )}
        {incident.isDemo && <DemoTag />}
        {!showMap && (
          <Link to={`/admin/incidents/${incident._id}`} className="ml-auto inline-flex items-center gap-1 text-xs text-accent">
            Open full page <ExternalLink size={12} />
          </Link>
        )}
      </div>

      <div className="grid gap-1.5 text-sm text-muted">
        <p className="flex items-center gap-2"><MapPin size={14} /> {incident.address || 'No address given'}</p>
        <p className="flex items-center gap-2"><Clock size={14} /> {formatDateTime(incident.createdAt)} ({timeAgo(incident.createdAt)})</p>
        {incident.reportCount > 1 && (
          <p className="flex items-center gap-2"><Users size={14} /> {incident.reportCount} linked reports</p>
        )}
      </div>

      {actionError && <p className="rounded-lg bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">{actionError}</p>}
      {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}

      {showMap && (
        <LiveTrackingMap
          incident={{ position: fromPoint(incident.location), severity: incident.severity, resolved: closed }}
          responders={mapResponders}
          className="h-64"
        />
      )}

      {/* AI analysis */}
      <Section
        title="AI Analysis"
        icon={Brain}
        action={
          !closed && (
            <button
              type="button"
              onClick={() => run('analyze', () => incidentApi.analyze(incident._id), 'Re-analysis complete')}
              disabled={busy === 'analyze'}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
            >
              <RefreshCw size={12} className={busy === 'analyze' ? 'animate-spin' : ''} /> Re-analyze
            </button>
          )
        }
      >
        {analyzing ? (
          <Spinner label="AI is analyzing..." />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-navy-950 p-2">
                <p className="text-[11px] text-muted">Score</p>
                <p className="text-xl font-extrabold">{incident.severityScore}</p>
              </div>
              <div className="rounded-lg bg-navy-950 p-2">
                <p className="text-[11px] text-muted">Confidence</p>
                <p className="text-xl font-extrabold">
                  {typeof ai.confidence === 'number' ? `${Math.round(ai.confidence * 100)}%` : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-navy-950 p-2">
                <p className="text-[11px] text-muted">Engine</p>
                <p className="text-xs font-semibold leading-5">{sourceLabel(ai.source)}</p>
              </div>
            </div>
            {ai.reason && <p className="text-sm text-muted">{ai.reason}</p>}
            <ScoreBreakdown breakdown={ai.scoreBreakdown} total={incident.severityScore} />
          </>
        )}
      </Section>

      {/* Verification / override */}
      {!closed && !analyzing && (
        <Section title="Verify or override" icon={ShieldCheck}>
          {incident.verification?.verifiedAt && (
            <p className="text-xs text-success">Verified {timeAgo(incident.verification.verifiedAt)}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={verifyForm.severity}
              onChange={(e) => setVerifyForm((f) => ({ ...f, severity: e.target.value }))}
              className="rounded-lg border border-navy-700 bg-navy-950 px-2 py-2 text-sm"
              aria-label="Override severity"
            >
              <option value="">Keep severity</option>
              {Object.entries(SEVERITY_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
            <select
              value={verifyForm.category}
              onChange={(e) => setVerifyForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded-lg border border-navy-700 bg-navy-950 px-2 py-2 text-sm"
              aria-label="Override category"
            >
              <option value="">Keep category</option>
              {Object.entries(CATEGORY_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
          <input
            value={verifyForm.note}
            onChange={(e) => setVerifyForm((f) => ({ ...f, note: e.target.value }))}
            maxLength={500}
            placeholder="Note (optional)"
            className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={verify}
            disabled={busy === 'verify'}
            className="w-full rounded-lg border border-accent/50 py-2 text-sm font-semibold text-accent disabled:opacity-50"
          >
            {busy === 'verify' ? 'Saving...' : verifyForm.severity || verifyForm.category ? 'Override and verify' : 'Verify AI result'}
          </button>
        </Section>
      )}

      {/* Assignments */}
      {visibleAssignments.length > 0 && (
        <Section
          title="Assigned responders"
          icon={Users}
          action={
            canSimulate && (
              <button
                type="button"
                onClick={() => run('simulate', () => demoApi.simulate(incident._id, 'normal'), 'Simulated response started')}
                disabled={busy === 'simulate'}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent"
              >
                <PlayCircle size={14} /> Simulate response
              </button>
            )
          }
        >
          <ul className="space-y-2">
            {visibleAssignments.map((a) => {
              const live = responderPositions[a.responder?._id];
              const eta = live?.etaMinutes ?? a.etaMinutes;
              return (
                <li key={a._id} className="flex items-center justify-between gap-2 rounded-lg bg-navy-950 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.responder?.user?.name || 'Responder'}</p>
                    <p className="text-xs text-muted">
                      {RESPONDER_TYPE_LABELS[a.responder?.type] || a.responder?.type} · {ASSIGNMENT_STATUS_LABELS[a.status]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    {['ACCEPTED', 'ON_THE_WAY'].includes(a.status) && eta != null && (
                      <span className="text-sm font-bold text-accent">{formatEta(eta)}</span>
                    )}
                    {a.responder?.user?.phone && (
                      <a href={`tel:${a.responder.user.phone}`} className="text-muted hover:text-fg" aria-label="Call responder">
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* Recommendations */}
      {!closed && !analyzing && (
        <Section title="Dispatch">
          <RecommendationList
            key={`${visibleAssignments.length}-${incident.status}`}
            incidentId={incident._id}
            onAssigned={() => {
              setMessage('Responders assigned');
              reload();
            }}
          />
        </Section>
      )}

      {/* Reports */}
      <Section title={`Citizen reports (${reports.length})`}>
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r._id} className="space-y-2 rounded-lg bg-navy-950 p-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{r.user?.name || 'Citizen'} · {timeAgo(r.createdAt)}</span>
                {r.isDuplicate && <span className="rounded bg-navy-700 px-1.5 py-0.5">Linked duplicate</span>}
              </div>
              {r.description && <p className="text-sm">{r.description}</p>}
              <ReportMedia media={r.media} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Timeline */}
      <Section title="Lifecycle">
        <StatusTimeline status={incident.status} history={incident.statusHistory} steps={ADMIN_STEPS} />
      </Section>

      {/* Final actions */}
      {incident.status !== 'CLOSED' && (
        <div className="grid grid-cols-2 gap-2 border-t border-navy-700 pt-4">
          {!closed && (
            <button
              type="button"
              onClick={resolve}
              disabled={busy === 'resolve'}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-success py-2.5 font-bold text-navy-950 disabled:opacity-50"
            >
              <CheckCircle2 size={16} /> Resolve incident
            </button>
          )}
          {incident.status === 'RESOLVED' && (
            <button
              type="button"
              onClick={closeIncident}
              disabled={busy === 'close'}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-lg border border-navy-700 py-2.5 font-semibold disabled:opacity-50"
            >
              <Archive size={16} /> Close and audit
            </button>
          )}
        </div>
      )}
    </>
  );
}