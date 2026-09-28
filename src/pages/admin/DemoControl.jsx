import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Sparkles, RotateCcw, Square, Info } from 'lucide-react';
import { demoApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import Spinner from '../../components/Spinner';

const SCENARIO_LABELS = {
  accident: 'Road accident',
  fire: 'Market fire',
  medical: 'Medical emergency',
  building: 'Building collapse',
  electrical: 'Live wire on road',
};

// Suggested 5-7 minute presentation flow from the project guidelines
const SCRIPT = [
  'Explain the problem: emergency information is fragmented.',
  'Report an emergency from the citizen portal (phone), or press "Run full demo".',
  'Show the AI analysis and the transparent score breakdown.',
  'Show duplicate reports merging into one incident.',
  'Assign the AI-recommended responders and watch them move live.',
  'Show the citizen tracking screen and the final Resolved status.',
  'Close with the lifecycle: Detect → Understand → Verify → Prioritize → Match → Respond → Track → Resolve.',
];

export default function DemoControl() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ scenario: '', speed: 'normal', withDuplicates: true });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setStatus(await demoApi.status());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const payload = () => ({
    ...(form.scenario && { scenario: form.scenario }),
    withDuplicates: form.withDuplicates,
  });

  const act = async (key, fn) => {
    setBusy(key);
    setError('');
    setMessage(null);
    try {
      const result = await fn();
      setMessage(result);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const runFull = () =>
    act('run', async () => {
      const r = await demoApi.run({ ...payload(), speed: form.speed });
      return { text: `Full demo started: ${SCENARIO_LABELS[r.scenario]} (${r.referenceId})`, incidentId: r.incidentId };
    });

  const generateOnly = () =>
    act('generate', async () => {
      const r = await demoApi.generate(payload());
      return {
        text: `Emergency created: ${SCENARIO_LABELS[r.scenario]} (${r.referenceId}). Assign it yourself.`,
        incidentId: r.incidentId,
      };
    });

  const reset = (all) => {
    const question = all
      ? 'Delete ALL incidents, including ones you created manually?'
      : 'Delete all simulated incidents and reset demo responders?';
    if (!window.confirm(question)) return;
    act('reset', async () => {
      const r = await demoApi.reset(all);
      return { text: `Reset complete: ${r.incidents} incident(s) removed, ${r.respondersReset} responder(s) reset.` };
    });
  };

  const stop = (incidentId) =>
    act('stop', async () => {
      await demoApi.stop(incidentId);
      return { text: 'Simulation stopped.' };
    });

  if (loading) return <Spinner label="Loading demo status..." />;

  if (!status) {
    return (
      <div className="rounded-2xl border border-high/40 bg-high/10 p-5">
        <p className="font-semibold">Demo Mode is not available</p>
        <p className="mt-1 text-sm text-muted">
          {error || 'Set DEMO_MODE=true in the backend .env and restart the server.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Demo Mode</h1>
        <p className="text-sm text-muted">
          Everything created here is clearly labelled as simulated. No real emergency service is contacted.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
          <p className="text-xs text-muted">Simulated incidents</p>
          <p className="text-3xl font-extrabold">{status.demoIncidents}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
          <p className="text-xs text-muted">Demo responders</p>
          <p className="text-3xl font-extrabold">{status.demoResponders}</p>
        </div>
        <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
          <p className="text-xs text-muted">Running simulations</p>
          <p className="text-3xl font-extrabold text-accent">{status.runningSimulations.length}</p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-critical/10 px-3 py-2 text-sm text-critical" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message.text}{' '}
          {message.incidentId && (
            <Link to={`/admin/incidents/${message.incidentId}`} className="font-semibold underline">
              Open incident
            </Link>
          )}
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-navy-700 bg-navy-900 p-5">
        <h2 className="font-semibold">Create a simulated emergency</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted">Scenario</span>
            <select
              value={form.scenario}
              onChange={(e) => setForm((f) => ({ ...f, scenario: e.target.value }))}
              className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2"
            >
              <option value="">Random</option>
              {status.scenarios.map((s) => (
                <option key={s} value={s}>
                  {SCENARIO_LABELS[s] || s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Response speed</span>
            <select
              value={form.speed}
              onChange={(e) => setForm((f) => ({ ...f, speed: e.target.value }))}
              className="w-full rounded-lg border border-navy-700 bg-navy-950 px-3 py-2"
            >
              {status.speeds.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={form.withDuplicates}
              onChange={(e) => setForm((f) => ({ ...f, withDuplicates: e.target.checked }))}
              className="h-4 w-4 accent-[#18C8E8]"
            />
            Add witness reports (duplicates)
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={runFull}
            disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent py-3 font-bold text-navy-950 disabled:opacity-60"
          >
            <PlayCircle size={18} /> {busy === 'run' ? 'Starting...' : 'Run full demo (automatic)'}
          </button>
          <button
            type="button"
            onClick={generateOnly}
            disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent/50 py-3 font-semibold text-accent disabled:opacity-60"
          >
            <Sparkles size={18} /> {busy === 'generate' ? 'Creating...' : 'Create only (I assign manually)'}
          </button>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted">
          <Info size={14} className="mt-0.5 shrink-0" />
          "Run full demo" goes from report to resolution by itself. "Create only" lets you show verification and
          assignment yourself; then press "Simulate response" in the incident panel.
        </p>
      </section>

      {status.runningSimulations.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-navy-700 bg-navy-900 p-5">
          <h2 className="font-semibold">Running simulations</h2>
          <ul className="space-y-2">
            {status.runningSimulations.map((id) => (
              <li key={id} className="flex items-center justify-between rounded-lg bg-navy-950 p-3 text-sm">
                <Link to={`/admin/incidents/${id}`} className="text-accent">
                  Incident {id.slice(-6)}
                </Link>
                <button
                  type="button"
                  onClick={() => stop(id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-critical"
                >
                  <Square size={12} /> Stop
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-navy-700 bg-navy-900 p-5">
        <h2 className="font-semibold">Reset</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => reset(false)}
            disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-navy-700 py-2.5 font-semibold disabled:opacity-60"
          >
            <RotateCcw size={16} /> Reset simulated data
          </button>
          <button
            type="button"
            onClick={() => reset(true)}
            disabled={Boolean(busy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-critical/50 py-2.5 font-semibold text-critical disabled:opacity-60"
          >
            <RotateCcw size={16} /> Reset everything
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-dashed border-navy-700 p-5">
        <h2 className="font-semibold">Presentation flow</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          {SCRIPT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}