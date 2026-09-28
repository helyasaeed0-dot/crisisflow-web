import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { demoApi } from '../../api/endpoints';
import { getErrorMessage } from '../../api/client';
import useLiveIncidents from '../../hooks/useLiveIncidents';
import KpiCards from '../../components/admin/KpiCards';
import CommandMap from '../../components/admin/CommandMap';
import IncidentFeed from '../../components/admin/IncidentFeed';
import IncidentPanel from '../../components/admin/IncidentPanel';
import ResponderStatusList from '../../components/admin/ResponderStatusList';

export default function Dashboard() {
  const { incidents, activeIncidents, responders, error } = useLiveIncidents();
  const [selectedId, setSelectedId] = useState(null);
  const [demoState, setDemoState] = useState({ running: false, message: '' });

  // One click: simulated emergency -> AI -> assign -> movement -> resolved
  const runDemo = async () => {
    setDemoState({ running: true, message: '' });
    try {
      const result = await demoApi.run({ withDuplicates: true, speed: 'normal' });
      setSelectedId(result.incidentId);
      setDemoState({ running: false, message: `Demo started: ${result.scenario} (${result.referenceId})` });
    } catch (err) {
      setDemoState({ running: false, message: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-sm text-muted">Live overview of every active emergency</p>
        </div>
        <div className="flex items-center gap-3">
          {demoState.message && <p className="text-sm text-muted">{demoState.message}</p>}
          <button
            type="button"
            onClick={runDemo}
            disabled={demoState.running}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-bold text-navy-950 disabled:opacity-60"
          >
            <PlayCircle size={18} /> {demoState.running ? 'Starting...' : 'Run live demo'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <KpiCards />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <CommandMap
            incidents={incidents}
            responders={responders}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <ResponderStatusList responders={responders} />
        </div>

        <div className="xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          {selectedId ? (
            <IncidentPanel incidentId={selectedId} onClose={() => setSelectedId(null)} />
          ) : (
            <IncidentFeed incidents={activeIncidents} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>
      </div>
    </div>
  );
}