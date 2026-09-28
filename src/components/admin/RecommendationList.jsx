import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { incidentApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import Spinner from '../Spinner';
import { RESPONDER_TYPE_LABELS } from '../../utils/constants';
import { formatDistance, formatEta } from '../../utils/format';

// AI-ranked responders; the admin makes the final decision
export default function RecommendationList({ incidentId, onAssigned }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await incidentApi.recommendations(incidentId, { limit: 6 });
      setData(result);
      setSelected(new Set(result.suggestedTeam.map((c) => c.responder._id)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Suggested team first, then other good matches, without duplicates
  const candidates = useMemo(() => {
    if (!data) return [];
    const suggestedIds = new Set(data.suggestedTeam.map((c) => c.responder._id));
    const others = data.recommendations.filter((c) => !suggestedIds.has(c.responder._id));
    return [...data.suggestedTeam.map((c) => ({ ...c, suggested: true })), ...others];
  }, [data]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assign = async () => {
    setAssigning(true);
    setError('');
    try {
      await incidentApi.assign(incidentId, [...selected]);
      onAssigned?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} className="text-accent" /> Recommended responders
        </h3>
        <button type="button" onClick={load} className="text-muted hover:text-fg" aria-label="Refresh recommendations">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && <Spinner label="Ranking responders..." />}
      {error && <p className="text-sm text-critical">{error}</p>}

      {data && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {data.requiredResources.map((r) => (
              <span key={r} className="rounded-md bg-navy-700 px-2 py-0.5 text-xs">
                {RESPONDER_TYPE_LABELS[r] || r}
              </span>
            ))}
          </div>

          {data.missingResources.length > 0 && (
            <p className="flex items-start gap-2 rounded-lg bg-high/10 p-2 text-xs text-high">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              No available {data.missingResources.map((r) => RESPONDER_TYPE_LABELS[r] || r).join(', ')} nearby.
            </p>
          )}

          {!candidates.length && <p className="text-sm text-muted">No available responders within range.</p>}

          <ul className="space-y-2">
            {candidates.map((c) => {
              const id = c.responder._id;
              const checked = selected.has(id);
              return (
                <li key={id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      checked ? 'border-accent/60 bg-accent/5' : 'border-navy-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(id)}
                      className="mt-1 h-4 w-4 accent-[#18C8E8]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {c.responder.user?.name || 'Responder'}
                          {c.suggested && <span className="ml-2 text-xs font-medium text-accent">Suggested</span>}
                        </p>
                        <span className="text-lg font-extrabold text-accent">{c.score}</span>
                      </div>
                      <p className="text-xs text-muted">
                        {RESPONDER_TYPE_LABELS[c.responder.type] || c.responder.type} · {formatDistance(c.distanceKm)} ·{' '}
                        {formatEta(c.etaMinutes)}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">
                        {c.breakdown.map((b) => `${b.factor.toLowerCase()} +${b.points}`).join(' · ')}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          {candidates.length > 0 && (
            <button
              type="button"
              onClick={assign}
              disabled={assigning || !selected.size}
              className="w-full rounded-lg bg-accent py-2.5 font-bold text-navy-950 disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : `Assign ${selected.size} responder${selected.size === 1 ? '' : 's'}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}