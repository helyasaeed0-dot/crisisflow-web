import L from 'leaflet';
import { SEVERITY_META, RESOLVED_META } from '../../utils/constants';

const RESPONDER_EMOJI = {
  AMBULANCE: '🚑',
  MEDICAL_TEAM: '⚕️',
  FIRE_BRIGADE: '🚒',
  POLICE: '🚓',
  RESCUE_TEAM: '🦺',
  UTILITY_TEAM: '🔧',
};

// Incident marker: color + symbol, so it is readable without color
export function incidentIcon({ severity, resolved = false, pulse = false, selected = false }) {
  const meta = resolved ? RESOLVED_META : SEVERITY_META[severity] || SEVERITY_META.LOW;
  const size = selected ? 34 : 28;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div class="${pulse ? 'cf-pulse' : ''}" style="width:${size}px;height:${size}px;border-radius:9999px;background:${meta.hex};border:${selected ? 3 : 2}px solid ${selected ? '#F8FAFC' : '#0B1220'};display:grid;place-items:center;color:#0B1220;font-size:13px;font-weight:800;" aria-label="${meta.label} incident">${meta.symbol}</div>`,
  });
}

// Responder marker: vehicle emoji in a rounded square
export function responderIcon({ type, busy = false }) {
  const emoji = RESPONDER_EMOJI[type] || '📍';
  const border = busy ? '#F59E0B' : '#18C8E8';

  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    html: `<div style="width:30px;height:30px;border-radius:8px;background:#111C2E;border:2px solid ${border};display:grid;place-items:center;font-size:16px;">${emoji}</div>`,
  });
}

// Pin used when the citizen chooses a location
export const pickerIcon = L.divIcon({
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  html: '<div style="width:26px;height:26px;border-radius:9999px;background:rgba(24,200,232,0.25);display:grid;place-items:center;"><div style="width:12px;height:12px;border-radius:9999px;background:#18C8E8;border:2px solid #F8FAFC;"></div></div>',
});