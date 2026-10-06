import React from 'react';
import { AlertTriangle, CloudRain, Flame, Snowflake, Wind } from 'lucide-react';

export const WeatherAlertList: React.FC<{ alerts: string[] }> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (alertText: string) => {
    const text = alertText.toLowerCase();
    if (text.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-600 shrink-0" />;
    if (text.includes('heat')) return <Flame className="w-5 h-5 text-amber-600 shrink-0" />;
    if (text.includes('frost')) return <Snowflake className="w-5 h-5 text-indigo-600 shrink-0" />;
    if (text.includes('wind')) return <Wind className="w-5 h-5 text-stone-600 shrink-0" />;
    return <AlertTriangle className="w-5 h-5 text-sun-600 shrink-0" />;
  };

  return (
    <div className="space-y-2.5">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3.5 rounded-xl bg-sun-50/80 border border-sun-200/90 text-sun-950 text-sm font-medium"
        >
          {getAlertIcon(alert)}
          <div className="flex-1">
            <span className="font-bold text-xs uppercase tracking-wider text-sun-800 bg-sun-100/80 px-2 py-0.5 rounded-md mr-2">
              Alert
            </span>
            <span>{alert}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
