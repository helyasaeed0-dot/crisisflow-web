import { useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import BaseMap, { FitBounds } from '../map/BaseMap';
import { incidentIcon, responderIcon } from '../map/mapIcons';
import { CATEGORY_META, DEFAULT_MAP_CENTER, SEVERITY_META, RESOLVED_META } from '../../utils/constants';
import { toLatLng } from '../../utils/format';

const CLOSED = ['RESOLVED', 'CLOSED'];
const RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function FlyToSelected({ incidents, selectedId }) {
  const map = useMap();
  const selected = incidents.find((i) => i._id === selectedId);
  const lat = selected?.position?.latitude;
  const lng = selected?.position?.longitude;

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, lat, lng]);

  return null;
}

// Legend uses text + symbols so it does not rely on color alone
function Legend() {
  const items = [...['CRITICAL', 'HIGH', 'MEDIUM'].map((k) => SEVERITY_META[k]), RESOLVED_META];
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 rounded-lg bg-navy-950/85 px-3 py-2 text-xs">
      {items.map((m) => (
        <span key={m.label} className="flex items-center gap-1.5">
          <span className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-navy-950" style={{ background: m.hex }}>
            {m.symbol}
          </span>
          {m.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">🚑 Responder</span>
    </div>
  );
}

export default function CommandMap({
  incidents = [],
  responders = [],
  selectedId,
  onSelect,
  showResponders = true,
  className = 'h-[480px]',
}) {
  const placed = incidents.filter((i) => i.position);
  const points = placed.map((i) => toLatLng(i.position));

  return (
    <div className="relative">
      <BaseMap center={points[0] || DEFAULT_MAP_CENTER} zoom={13} className={className}>
        {placed.map((i) => {
          const resolved = CLOSED.includes(i.status);
          return (
            <Marker
              key={i._id}
              position={toLatLng(i.position)}
              icon={incidentIcon({
                severity: i.severity,
                resolved,
                pulse: i.severity === 'CRITICAL' && !resolved,
                selected: i._id === selectedId,
              })}
              zIndexOffset={resolved ? 0 : (RANK[i.severity] || 0) * 100 + 500}
              eventHandlers={{ click: () => onSelect?.(i._id) }}
            >
              <Tooltip direction="top" offset={[0, -14]}>
                {CATEGORY_META[i.category]?.label || i.category} · {resolved ? 'Resolved' : i.severity}
                <br />
                {i.referenceId}
              </Tooltip>
            </Marker>
          );
        })}

        {showResponders &&
          responders
            .filter((r) => r.position)
            .map((r) => (
              <Marker
                key={r._id}
                position={toLatLng(r.position)}
                icon={responderIcon({ type: r.type, busy: r.availability === 'BUSY' })}
              >
                <Tooltip direction="top" offset={[0, -14]}>
                  {r.name || r.type} · {r.availability}
                </Tooltip>
              </Marker>
            ))}

        <FitBounds points={points} />
        <FlyToSelected incidents={placed} selectedId={selectedId} />
      </BaseMap>
      <Legend />
    </div>
  );
}