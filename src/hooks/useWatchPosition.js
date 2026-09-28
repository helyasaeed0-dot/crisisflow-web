import { useEffect, useRef, useState } from 'react';
import { responderApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';

/**
 * While enabled, watches the device GPS and sends the position to the backend.
 * Updates are throttled so the server is not flooded.
 */
export default function useWatchPosition(enabled, { minIntervalMs = 8000 } = {}) {
  const [state, setState] = useState({ error: null, lastSentAt: null, position: null });
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;

    if (!('geolocation' in navigator) || !window.isSecureContext) {
      setState((s) => ({ ...s, error: 'Live GPS sharing needs HTTPS or localhost.' }));
      return undefined;
    }

    setState((s) => ({ ...s, error: null }));

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < minIntervalMs) return;
        lastSentRef.current = now;

        const { latitude, longitude } = pos.coords;
        try {
          await responderApi.updateStatus({ latitude, longitude });
          setState({ error: null, lastSentAt: new Date(), position: { latitude, longitude } });
        } catch (err) {
          setState((s) => ({ ...s, error: getErrorMessage(err) }));
        }
      },
      (err) => setState((s) => ({ ...s, error: err.message || 'Could not read GPS' })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, minIntervalMs]);

  return state;
}