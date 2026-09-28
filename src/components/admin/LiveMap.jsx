import { useState } from 'react';
import useLiveIncidents from '../../hooks/useLiveIncidents';
import CommandMap from '../../components/admin/CommandMap';
import IncidentFeed from '../../components/admin/IncidentFeed';
import IncidentPanel from '../../components/admin/IncidentPanel';

export default function LiveMap() {
  const { incidents, activeIncidents, responders } = useLiveIncidents();
  const [selectedId, setSelectedId] = useState(null);
  const [showResponders, setShowResponders] = useState(true);
  const [showResolved, setShowResolved] = useState(true);

  const onMap = showResolved ? incidents : activeIncidents;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Live Map</h1>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showResponders} onChange={(e) => setShowResponders(e.target.checked)} className="accent-[#18C8E8]" />
            Responders
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-[#18C8E8]" />
            Recently resolved
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <CommandMap
          incidents={onMap}
          responders={responders}
          selectedId={selectedId}
          onSelect={setSelectedId}
          showResponders={showResponders}
          className="h-[calc(100vh-11rem)] min-h-[420px]"
        />
        <div className="lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
          {selectedId ? (
            <IncidentPanel incidentId={selectedId} onClose={() => setSelectedId(null)} />
          ) : (
            <IncidentFeed incidents={activeIncidents} onSelect={setSelectedId} />
          )}
        </div>
      </div>
    </div>
  );
}