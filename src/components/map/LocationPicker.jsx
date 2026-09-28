import { useEffect } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import BaseMap from './BaseMap';
import { pickerIcon } from './mapIcons';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function FollowPosition({ position }) {
  const map = useMap();
  const lat = position?.[0];
  const lng = position?.[1];

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [map, lat, lng]);

  return null;
}

// Tap the map or drag the pin to choose a location
export default function LocationPicker({ value, onChange, className = 'h-72' }) {
  const position = value ? [value.latitude, value.longitude] : null;

  return (
    <BaseMap center={position || DEFAULT_MAP_CENTER} zoom={position ? 16 : 13} className={className}>
      <ClickHandler onPick={onChange} />
      {position && (
        <Marker
          position={position}
          icon={pickerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onChange({ latitude: lat, longitude: lng });
            },
          }}
        />
      )}
      <FollowPosition position={position} />
    </BaseMap>
  );
}