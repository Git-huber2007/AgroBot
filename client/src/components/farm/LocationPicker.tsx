import React, { useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(5));
        const lng = Number(position.coords.longitude.toFixed(5));
        onChange(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. You can enter coordinates manually.');
        } else {
          setGeoError('Unable to retrieve location. Please enter coordinates manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-stone-800">Farm GPS Coordinates (Optional)</span>
          <p className="text-xs text-stone-500">
            Enables high-precision 7-day weather forecasts for your exact farm
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          leftIcon={
            isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 text-leaf-600" />
          }
        >
          {isLocating ? 'Locating...' : 'Use My GPS Location'}
        </Button>
      </div>

      {geoError && (
        <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
          {geoError}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">
            Latitude (6° to 38° N)
          </label>
          <input
            type="number"
            step="0.00001"
            min="6"
            max="38"
            value={latitude ?? ''}
            onChange={(e) =>
              onChange(e.target.value ? parseFloat(e.target.value) : null, longitude ?? null)
            }
            placeholder="e.g. 19.0760"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-200 focus:border-leaf-600 bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-stone-600 block mb-1">
            Longitude (68° to 98° E)
          </label>
          <input
            type="number"
            step="0.00001"
            min="68"
            max="98"
            value={longitude ?? ''}
            onChange={(e) =>
              onChange(latitude ?? null, e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder="e.g. 72.8777"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf-200 focus:border-leaf-600 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
