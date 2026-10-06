import React from 'react';
import { getWeatherIcon } from './WeatherCard';

export interface ForecastDay {
  date: string;
  weather_code: number;
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum: number;
  precipitation_probability_max?: number;
  wind_speed_10m_max: number;
}

export const ForecastStrip: React.FC<{ days: ForecastDay[] }> = ({ days }) => {
  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-2.5 min-w-max">
        {days.map((day, idx) => {
          const dateObj = new Date(day.date);
          const weekday = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayMonth = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

          return (
            <div
              key={day.date}
              className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                idx === 0
                  ? 'bg-leaf-50/60 border-leaf-200 shadow-sm'
                  : 'bg-white border-stone-200/80 hover:border-stone-300'
              } min-w-[96px]`}
            >
              <span className="text-xs font-bold text-stone-900">{weekday}</span>
              <span className="text-[11px] text-stone-500 mb-2">{dayMonth}</span>

              <div className="my-1">{getWeatherIcon(day.weather_code)}</div>

              <div className="mt-2 text-xs font-bold text-stone-900">
                {Math.round(day.temperature_2m_max)}°
                <span className="text-stone-400 font-normal ml-1">
                  {Math.round(day.temperature_2m_min)}°
                </span>
              </div>

              {day.precipitation_sum > 0 ? (
                <span className="mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {day.precipitation_sum} mm
                </span>
              ) : (
                <span className="mt-1 text-[11px] text-stone-400">0 mm</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
