import { useCallback, useEffect, useRef, useState } from 'react';
import { incidentApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useJoinIncident, useSocketEvent } from '../context/SocketContext';

// Loads one incident and keeps it updated in real time
export default function useIncident(incidentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responderPositions, setResponderPositions] = useState({});
  const reloadTimer = useRef(null);

  const load = useCallback(async () => {
    try {
      const result = await incidentApi.get(incidentId);
      setData(result);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setResponderPositions({});
    load();
  }, [load]);

  useEffect(() => () => clearTimeout(reloadTimer.current), []);

  useJoinIncident(incidentId);

  // Several events can arrive together, so reload once after they settle
  const scheduleReload = useCallback(() => {
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(load, 400);
  }, [load]);

  const handleIncidentEvent = (payload) => {
    const id = payload?._id || payload?.incidentId;
    if (String(id) !== String(incidentId)) return;

    // Show the new status immediately, then refresh the full details
    if (payload?._id) {
      setData((d) =>
        d ? { ...d, incident: { ...d.incident, ...payload, createdBy: d.incident.createdBy } } : d
      );
    }
    scheduleReload();
  };

  useSocketEvent('incident.updated', handleIncidentEvent);
  useSocketEvent('incident.assigned', handleIncidentEvent);
  useSocketEvent('responder.accepted', handleIncidentEvent);
  useSocketEvent('incident.resolved', handleIncidentEvent);

  useSocketEvent('responder.location.updated', (p) => {
    if (String(p?.incidentId) !== String(incidentId) || !p.location) return;
    setResponderPositions((prev) => ({
      ...prev,
      [p.responderId]: {
        latitude: p.location.latitude,
        longitude: p.location.longitude,
        distanceKm: p.distanceKm,
        etaMinutes: p.etaMinutes,
      },
    }));
  });

  return { data, loading, error, reload: load, responderPositions };
}