import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';

// Free OpenStreetMap tiles (no API key). Attribution is required by their usage policy.
// The tiles are darkened with CSS (see .cf-dark-tiles in index.css).
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function BaseMap({ center, zoom = 14, className = 'h-72', children }) {
  return (
    <MapContainer
      center={center || DEFAULT_MAP_CENTER}
      zoom={zoom}
      className={`w-full overflow-hidden rounded-xl border border-navy-700 ${className}`}
      scrollWheelZoom
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} className="cf-dark-tiles" />
      {children}
    </MapContainer>
  );
}

// Fits the map to show all points; refits only when the number of points changes
export function FitBounds({ points }) {
  const map = useMap();
  const valid = points.filter(Boolean);
  const count = valid.length;

  useEffect(() => {
    if (!count) return;
    if (count === 1) {
      map.setView(valid[0], Math.max(map.getZoom(), 15));
    } else {
      map.fitBounds(valid, { padding: [40, 40], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, count]);

  return null;
}