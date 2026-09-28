import { Fragment } from 'react';
import { Marker, Polyline, Popup } from 'react-leaflet';
import BaseMap, { FitBounds } from './BaseMap';
import { incidentIcon, responderIcon } from './mapIcons';
import { formatEta, toLatLng } from '../../utils/format';

/**
 * incident:   { position, severity, resolved }
 * responders: [{ id, name, type, position, etaMinutes }]
 */
export default function LiveTrackingMap({ incident, responders = [], className = 'h-72' }) {
  const incidentLatLng = toLatLng(incident.position);
  const moving = responders.filter((r) => r.position);
  const points = [incidentLatLng, ...moving.map((r) => toLatLng(r.position))];

  return (
    <BaseMap center={incidentLatLng} zoom={15} className={className}>
      <Marker
        position={incidentLatLng}
        icon={incidentIcon({
          severity: incident.severity,
          resolved: incident.resolved,
          pulse: incident.severity === 'CRITICAL' && !incident.resolved,
        })}
      >
        <Popup>Emergency location</Popup>
      </Marker>

      {moving.map((r) => (
        <Fragment key={r.id}>
          <Polyline
            positions={[toLatLng(r.position), incidentLatLng]}
            pathOptions={{ color: '#18C8E8', weight: 2, dashArray: '6 8', opacity: 0.8 }}
          />
          <Marker position={toLatLng(r.position)} icon={responderIcon({ type: r.type })}>
            <Popup>
              {r.name}
              {r.etaMinutes ? ` · ${formatEta(r.etaMinutes)}` : ''}
            </Popup>
          </Marker>
        </Fragment>
      ))}

      <FitBounds points={points} />
    </BaseMap>
  );
}