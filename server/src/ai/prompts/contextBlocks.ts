import type { Farm } from '@cropsage/shared';
import type { WeatherSummary } from '../../services/weather.service.js';

export function formatFarmContextBlock(farm: Farm): string {
  const latStr = farm.latitude !== null ? farm.latitude.toFixed(2) : 'Not specified';
  const lngStr = farm.longitude !== null ? farm.longitude.toFixed(2) : 'Not specified';
  const soilN = farm.soil_n !== null ? farm.soil_n : 'NA';
  const soilP = farm.soil_p !== null ? farm.soil_p : 'NA';
  const soilK = farm.soil_k !== null ? farm.soil_k : 'NA';
  const soilPh = farm.soil_ph !== null ? farm.soil_ph : 'not tested';
  const soilOc = farm.soil_oc !== null ? farm.soil_oc : 'not tested';
  const soilEc = farm.soil_ec !== null ? farm.soil_ec : 'NA';
  const acres = (farm.area_hectares * 2.47105).toFixed(2);

  return `- Location: ${farm.district}, ${farm.state} (lat ${latStr}, lng ${lngStr})
- Area: ${farm.area_hectares.toFixed(2)} ha (${acres} acres)
- Soil type: ${farm.soil_type}; pH: ${soilPh}; OC: ${soilOc}%; N/P/K (kg/ha): ${soilN}/${soilP}/${soilK}; EC: ${soilEc}
- Irrigation: ${farm.irrigation_source}; water availability: ${farm.water_availability}
- Farming practice: ${farm.farming_practice}`;
}

export function formatWeatherForecastTable(weather?: WeatherSummary | null): {
  table: string;
  ruleAlerts: string;
} {
  if (!weather || weather.unavailable || !weather.daily || weather.daily.length === 0) {
    return {
      table: 'Weather data unavailable — give general guidance and say so in weather_alerts.',
      ruleAlerts: 'none',
    };
  }

  const header = '| Date | Max Temp (°C) | Min Temp (°C) | Rain (mm) | Rain Prob (%) | Wind (km/h) |\n|---|---|---|---|---|---|';
  const rows = weather.daily.map(
    d => `| ${d.date} | ${d.temperatureMax.toFixed(1)} | ${d.temperatureMin.toFixed(1)} | ${d.precipitationMm.toFixed(1)} | ${d.precipitationProbability}% | ${d.windSpeedMaxKmH.toFixed(1)} |`,
  );

  const alertsStr =
    weather.alerts && weather.alerts.length > 0
      ? weather.alerts.map(a => `[${a.severity.toUpperCase()}] ${a.title}: ${a.action}`).join('; ')
      : 'none';

  return {
    table: `${header}\n${rows.join('\n')}`,
    ruleAlerts: alertsStr,
  };
}
