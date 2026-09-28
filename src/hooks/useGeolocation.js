import { useCallback, useState } from 'react';

function messageFor(error) {
  switch (error.code) {
    case 1:
      return 'Location permission was denied. Please pick your location on the map.';
    case 2:
      return 'Your location is unavailable right now. Please pick it on the map.';
    case 3:
      return 'Getting your location took too long. Please pick it on the map.';
    default:
      return 'Could not get your location. Please pick it on the map.';
  }
}

export default function useGeolocation() {
  const [state, setState] = useState({ position: null, error: null, loading: false });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, error: 'This browser does not support location. Please pick it on the map.' }));
      return;
    }
    // Browsers only allow GPS on HTTPS or localhost
    if (!window.isSecureContext) {
      setState((s) => ({ ...s, error: 'GPS needs HTTPS or localhost. Please pick your location on the map.' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          error: null,
          loading: false,
        }),
      (err) => setState({ position: null, error: messageFor(err), loading: false }),
            // Laptops have no GPS chip; Wi-Fi based location is faster and accurate enough
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, request };
}