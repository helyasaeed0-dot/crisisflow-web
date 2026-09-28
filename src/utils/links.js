// Where an incident opens for each role
export function incidentLinkFor(role, incidentId) {
  if (!incidentId) return null;
  switch (role) {
    case 'CITIZEN':
      return `/citizen/track/${incidentId}`;
    case 'RESPONDER':
      return `/responder/assignments/${incidentId}`;
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return `/admin/incidents/${incidentId}`;
    default:
      return null;
  }
}
// Opens turn-by-turn directions in Google Maps (app on phones, website on laptops)
export function navigationUrl(position) {
  if (!position) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${position.latitude},${position.longitude}&travelmode=driving`;
}