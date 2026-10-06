import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Droplets, Thermometer } from 'lucide-react';
import { Card } from '../ui/Card';

export interface WeatherSummary {
  latitude: number;
  longitude: number;
  elevation?: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: Array<{
    date: string;
    weather_code: number;
    temperature_2m_max: number;
    temperature_2m_min: number;
    precipitation_sum: number;
    precipitation_probability_max?: number;
    wind_speed_10m_max: number;
  }>;
  alerts: string[];
}

export function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="w-8 h-8 text-sun-500" />;
  if (code >= 1 && code <= 3) return <Cloud className="w-8 h-8 text-stone-400" />;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return <CloudRain className="w-8 h-8 text-blue-500" />;
  if (code >= 95) return <CloudLightning className="w-8 h-8 text-amber-500" />;
  return <Cloud className="w-8 h-8 text-stone-400" />;
}

export function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

export const WeatherCard: React.FC<{ weather: WeatherSummary; farmName: string }> = ({
  weather,
  farmName,
}) => {
  const current = weather.current;

  return (
    <Card className="bg-gradient-to-br from-white to-stone-50 border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-leaf-700 bg-leaf-50 px-2.5 py-1 rounded-md border border-leaf-200">
            Live Weather (Open-Meteo)
          </span>
          <h3 className="text-xl font-bold text-stone-900 mt-2 font-display">{farmName}</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Updated today • Coordinates: {weather.latitude.toFixed(2)}°N, {weather.longitude.toFixed(2)}°E
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sun-50/80 border border-sun-100 flex items-center justify-center">
            {getWeatherIcon(current.weather_code)}
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-stone-900 font-display">
              {Math.round(current.temperature_2m)}°C
            </div>
            <p className="text-sm font-semibold text-stone-600">
              {getWeatherDescription(current.weather_code)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-stone-200/60">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-stone-500">Humidity</p>
            <p className="text-sm font-bold text-stone-800">{current.relative_humidity_2m}%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-stone-400 shrink-0" />
          <div>
            <p className="text-xs text-stone-500">Wind</p>
            <p className="text-sm font-bold text-stone-800">{current.wind_speed_10m} km/h</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-stone-500">Rainfall</p>
            <p className="text-sm font-bold text-stone-800">{current.precipitation} mm</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
