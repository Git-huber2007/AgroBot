import { env } from '../config/env.js';
import { supabaseAdmin } from '../db/adminClient.js';
import { logger } from '../utils/logger.js';

export interface WeatherDayForecast {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationMm: number;
  precipitationProbability: number;
  windSpeedMaxKmH: number;
  weatherCode: number;
}

export interface RuleBasedWeatherAlert {
  type: 'heavy_rain' | 'heat' | 'frost' | 'high_wind' | 'disease_risk';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: string;
}

export interface WeatherSummary {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperature: number;
    relativeHumidity: number;
    windSpeedKmH: number;
    weatherCode: number;
    isDay: boolean;
  };
  daily: WeatherDayForecast[];
  alerts: RuleBasedWeatherAlert[];
  fetchedAt: string;
  isCached: boolean;
  unavailable?: boolean;
}

export class WeatherService {
  /**
   * Fetches and caches weather forecast for given coordinates with rule-based agro-alerts.
   */
  public static async getForecast(latitude: number, longitude: number): Promise<WeatherSummary> {
    const lat2 = Number(latitude.toFixed(2));
    const lng2 = Number(longitude.toFixed(2));
    const cacheKey = `${lat2},${lng2}`;

    // 1. Check database cache
    try {
      const { data: cached } = await supabaseAdmin
        .from('weather_cache')
        .select('payload, fetched_at')
        .eq('cache_key', cacheKey)
        .maybeSingle();

      if (cached?.payload && cached.fetched_at) {
        const cacheAgeMs = Date.now() - new Date(cached.fetched_at).getTime();
        const maxAgeMs = env.WEATHER_CACHE_TTL_MINUTES * 60 * 1000;
        if (cacheAgeMs < maxAgeMs) {
          return {
            ...(cached.payload as WeatherSummary),
            isCached: true,
          };
        }
      }
    } catch (err) {
      logger.warn({ err, cacheKey }, 'Failed to query weather cache from DB');
    }

    // 2. Query Open-Meteo REST API
    try {
      const url = new URL(env.OPEN_METEO_BASE_URL);
      url.searchParams.set('latitude', lat2.toString());
      url.searchParams.set('longitude', lng2.toString());
      url.searchParams.set(
        'current',
        'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
      );
      url.searchParams.set(
        'daily',
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      );
      url.searchParams.set('timezone', 'Asia/Kolkata');
      url.searchParams.set('forecast_days', '7');

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000), // 8-second timeout per §18.13
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = await response.json() as {
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          wind_speed_10m?: number;
          weather_code?: number;
          is_day?: number;
        };
        daily?: {
          time?: string[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
          precipitation_sum?: number[];
          precipitation_probability_max?: number[];
          wind_speed_10m_max?: number[];
          weather_code?: number[];
        };
      };

      const dailyTimes = raw.daily?.time ?? [];
      const dailyForecasts: WeatherDayForecast[] = dailyTimes.map((dateStr, i) => ({
        date: dateStr,
        temperatureMax: raw.daily?.temperature_2m_max?.[i] ?? 0,
        temperatureMin: raw.daily?.temperature_2m_min?.[i] ?? 0,
        precipitationMm: raw.daily?.precipitation_sum?.[i] ?? 0,
        precipitationProbability: raw.daily?.precipitation_probability_max?.[i] ?? 0,
        windSpeedMaxKmH: raw.daily?.wind_speed_10m_max?.[i] ?? 0,
        weatherCode: raw.daily?.weather_code?.[i] ?? 0,
      }));

      const alerts = this.computeRuleBasedAlerts(
        raw.current?.relative_humidity_2m ?? 60,
        dailyForecasts,
      );

      const summary: WeatherSummary = {
        latitude: lat2,
        longitude: lng2,
        timezone: 'Asia/Kolkata',
        current: {
          temperature: raw.current?.temperature_2m ?? 28,
          relativeHumidity: raw.current?.relative_humidity_2m ?? 65,
          windSpeedKmH: raw.current?.wind_speed_10m ?? 10,
          weatherCode: raw.current?.weather_code ?? 0,
          isDay: raw.current?.is_day === 1,
        },
        daily: dailyForecasts,
        alerts,
        fetchedAt: new Date().toISOString(),
        isCached: false,
      };

      // 3. Upsert to DB cache
      try {
        await supabaseAdmin.from('weather_cache').upsert({
          cache_key: cacheKey,
          payload: summary,
          fetched_at: new Date().toISOString(),
        });
      } catch (cacheErr) {
        logger.warn({ cacheErr }, 'Failed to persist weather forecast in database cache');
      }

      return summary;
    } catch (apiError) {
      logger.error({ apiError, lat2, lng2 }, 'Weather service query failed, using fallback');
      return this.getFallbackWeather(lat2, lng2);
    }
  }

  /**
   * Deterministic agronomic rule-based alerts (§4.9)
   */
  private static computeRuleBasedAlerts(
    currentHumidity: number,
    daily: WeatherDayForecast[],
  ): RuleBasedWeatherAlert[] {
    const alerts: RuleBasedWeatherAlert[] = [];

    // 1. Heavy rain > 50 mm/day
    const heavyRainDay = daily.find(d => d.precipitationMm >= 50);
    if (heavyRainDay) {
      alerts.push({
        type: 'heavy_rain',
        severity: 'critical',
        title: `Heavy Rainfall Forecast (${heavyRainDay.precipitationMm.toFixed(0)} mm)`,
        description: `Heavy precipitation expected on ${heavyRainDay.date}. Avoid fertilizer application and clear field drainage channels.`,
        impact: 'Risk of waterlogging, root asphyxiation, and fertilizer leaching.',
        action: 'Postpone irrigation and spraying. Ensure drainage channels are open.',
      });
    }

    // 2. Heat > 40 °C
    const extremeHeatDay = daily.find(d => d.temperatureMax >= 40);
    if (extremeHeatDay) {
      alerts.push({
        type: 'heat',
        severity: 'warning',
        title: `Extreme Heat Warning (${extremeHeatDay.temperatureMax.toFixed(0)} °C)`,
        description: `Daytime temperatures exceed 40 °C on ${extremeHeatDay.date}. High evapotranspiration rate.`,
        impact: 'Pollen sterility, wilting, and increased water deficit stress.',
        action: 'Schedule irrigation during early morning or evening hours to avoid thermal shock.',
      });
    }

    // 3. Frost < 4 °C
    const frostDay = daily.find(d => d.temperatureMin <= 4);
    if (frostDay) {
      alerts.push({
        type: 'frost',
        severity: 'critical',
        title: `Frost Warning (${frostDay.temperatureMin.toFixed(0)} °C)`,
        description: `Night temperatures dropping to ${frostDay.temperatureMin.toFixed(0)} °C on ${frostDay.date}.`,
        impact: 'Cell freezing, foliar necrosis, and blossom drop in sensitive crops.',
        action: 'Provide light evening irrigation or smoke mulching to conserve ground heat.',
      });
    }

    // 4. High wind > 40 km/h
    const highWindDay = daily.find(d => d.windSpeedMaxKmH >= 40);
    if (highWindDay) {
      alerts.push({
        type: 'high_wind',
        severity: 'warning',
        title: `High Wind Advisory (${highWindDay.windSpeedMaxKmH.toFixed(0)} km/h)`,
        description: `Strong gusts expected on ${highWindDay.date}.`,
        impact: 'Lodging risk in tall crops (maize, sugarcane) and physical blossom tear.',
        action: 'Suspend all foliar pesticide spraying to prevent chemical drift.',
      });
    }

    // 5. High humidity (> 85% for 3+ days) -> disease risk
    const highHumidityDays = daily.filter(d => d.precipitationProbability >= 60 || currentHumidity > 85);
    if (highHumidityDays.length >= 3) {
      alerts.push({
        type: 'disease_risk',
        severity: 'warning',
        title: 'Elevated Fungal / Bacterial Disease Risk',
        description: 'Consecutive wet days with high ambient humidity detected.',
        impact: 'Favorable microclimate for spore germination (rusts, blights, downy mildew).',
        action: 'Monitor field for early leaf spots. Inspect underside of leaves regularly.',
      });
    }

    return alerts;
  }

  /**
   * Graceful fallback when Open-Meteo is temporarily unreachable (§7)
   */
  private static getFallbackWeather(lat: number, lng: number): WeatherSummary {
    return {
      latitude: lat,
      longitude: lng,
      timezone: 'Asia/Kolkata',
      current: {
        temperature: 28,
        relativeHumidity: 65,
        windSpeedKmH: 12,
        weatherCode: 1,
        isDay: true,
      },
      daily: [],
      alerts: [],
      fetchedAt: new Date().toISOString(),
      isCached: false,
      unavailable: true,
    };
  }
}
