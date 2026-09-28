export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';

export const formatTime = (date) =>
  date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export function formatDistance(km) {
  if (km === null || km === undefined) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Number(km).toFixed(1)} km`;
}

export function formatEta(minutes) {
  if (minutes === null || minutes === undefined) return '';
  return minutes <= 1 ? 'about 1 min' : `about ${minutes} min`;
}

// GeoJSON point [lng, lat] -> { latitude, longitude }
export function fromPoint(point) {
  if (!point || !Array.isArray(point.coordinates)) return null;
  const [longitude, latitude] = point.coordinates;
  return { latitude, longitude };
}

// { latitude, longitude } -> [lat, lng] for Leaflet
export const toLatLng = (p) => (p ? [p.latitude, p.longitude] : null);