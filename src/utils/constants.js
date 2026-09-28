// Severity: color + text + shape, so meaning never depends on color alone
export const SEVERITY_META = {
  CRITICAL: { label: 'Critical', hex: '#E53935', text: 'text-critical', bg: 'bg-critical/15', border: 'border-critical/40', symbol: '▲' },
  HIGH: { label: 'High', hex: '#F59E0B', text: 'text-high', bg: 'bg-high/15', border: 'border-high/40', symbol: '◆' },
  MEDIUM: { label: 'Medium', hex: '#F4C430', text: 'text-medium', bg: 'bg-medium/15', border: 'border-medium/40', symbol: '●' },
  LOW: { label: 'Low', hex: '#94A3B8', text: 'text-muted', bg: 'bg-muted/15', border: 'border-muted/40', symbol: '○' },
};

export const RESOLVED_META = {
  label: 'Resolved', hex: '#22C55E', text: 'text-success', bg: 'bg-success/15', border: 'border-success/40', symbol: '✓',
};

export const STATUS_LABELS = {
  REPORTED: 'Reported',
  AI_ANALYSIS: 'AI Analysis',
  VERIFIED: 'Verified / Prioritized',
  ASSIGNED: 'Responder Assigned',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the Way',
  ARRIVED: 'Arrived',
  HANDLING: 'Handling',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed / Audited',
};

// Lifecycle order used for progress trackers
export const STATUS_FLOW = [
  'REPORTED', 'AI_ANALYSIS', 'VERIFIED', 'ASSIGNED', 'ACCEPTED',
  'ON_THE_WAY', 'ARRIVED', 'HANDLING', 'RESOLVED', 'CLOSED',
];

export const CATEGORY_META = {
  ACCIDENT: { label: 'Accident', emoji: '🚗' },
  FIRE: { label: 'Fire', emoji: '🔥' },
  MEDICAL: { label: 'Medical', emoji: '🩺' },
  ROAD_BLOCKAGE: { label: 'Road Blockage', emoji: '🚧' },
  WATER_LEAKAGE: { label: 'Water Leakage', emoji: '💧' },
  ELECTRICAL_HAZARD: { label: 'Electrical Hazard', emoji: '⚡' },
  BUILDING_EMERGENCY: { label: 'Building Emergency', emoji: '🏚️' },
  PERSON_IN_DANGER: { label: 'Person in Danger', emoji: '🆘' },
  OTHER: { label: 'Other', emoji: '❗' },
};

export const RESPONDER_TYPE_LABELS = {
  AMBULANCE: 'Ambulance',
  MEDICAL_TEAM: 'Medical Team',
  FIRE_BRIGADE: 'Fire Brigade',
  POLICE: 'Police',
  RESCUE_TEAM: 'Rescue Team',
  UTILITY_TEAM: 'Utility Team',
};

export const DEMO_PASSWORD = 'Demo@12345';

// The admin demo button is hidden unless VITE_SHOW_DEMO_ADMIN=true (keep it off on a public site)
const SHOW_DEMO_ADMIN = import.meta.env.VITE_SHOW_DEMO_ADMIN === 'true';

export const DEMO_ACCOUNTS = [
  { label: 'Citizen', email: 'citizen@crisisflow.demo' },
  { label: 'Responder', email: 'ambulance1@crisisflow.demo' },
  ...(SHOW_DEMO_ADMIN ? [{ label: 'Admin', email: 'admin@crisisflow.demo' }] : []),
];
// Default map center (same city as the backend demo data)
export const DEFAULT_MAP_CENTER = [
  Number(import.meta.env.VITE_DEFAULT_LAT || 31.5204),
  Number(import.meta.env.VITE_DEFAULT_LNG || 74.3587),
];

export const EMERGENCY_NUMBERS = [
  { label: 'Rescue', number: '1122' },
  { label: 'Police', number: '15' },
  { label: 'Fire Brigade', number: '16' },
  { label: 'Edhi Ambulance', number: '115' },
];
export const ASSIGNMENT_STATUS_LABELS = {
  ASSIGNED: 'New - awaiting your response',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the Way',
  ARRIVED: 'Arrived',
  HANDLING: 'Handling',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};