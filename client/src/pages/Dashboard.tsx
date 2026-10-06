import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  AlertCircle,
  Calculator,
  Compass,
  MessageSquare,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../hooks/useAuth';
import { useActiveFarm } from '../hooks/useActiveFarm';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { WeatherCard, type WeatherSummary } from '../components/weather/WeatherCard';
import { ForecastStrip } from '../components/weather/ForecastStrip';
import { WeatherAlertList } from '../components/weather/WeatherAlertList';
import { formatDateTime } from '../lib/formatters';

export const Dashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const { activeFarm, farms, isLoading: isFarmsLoading } = useActiveFarm();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farmer';

  // Weather query for active farm
  const {
    data: weather,
    isLoading: isWeatherLoading,
    error: weatherError,
  } = useQuery<WeatherSummary>({
    queryKey: queryKeys.farmWeather(activeFarm?.id || ''),
    queryFn: () => api.get<WeatherSummary>(`/farms/${activeFarm!.id}/weather`),
    enabled: !!activeFarm?.id,
  });

  // Recent history items query
  const { data: historyData, isLoading: isHistoryLoading } = useQuery<{
    items: Array<{
      id: string;
      record_type: string;
      title_hint: string | null;
      created_at: string;
    }>;
  }>({
    queryKey: queryKeys.history({ pageSize: 5 }),
    queryFn: () => api.get('/history', { params: { pageSize: 5 } }),
  });

  const recentItems = historyData?.items || [];

  const getRecordTypeBadge = (type: string) => {
    switch (type) {
      case 'crop_advisory':
        return <Badge variant="leaf">Advisory</Badge>;
      case 'crop_recommendation':
        return <Badge variant="sun">Recommendation</Badge>;
      case 'pest_diagnosis':
        return <Badge variant="red">Pest Diagnosis</Badge>;
      case 'fertilizer_plan':
        return <Badge variant="blue">Fertilizer Plan</Badge>;
      default:
        return <Badge variant="gray">{type}</Badge>;
    }
  };

  const getRecordLink = (type: string, id: string) => {
    switch (type) {
      case 'crop_advisory':
        return `/advisory/${id}`;
      case 'crop_recommendation':
        return `/recommend/${id}`;
      case 'pest_diagnosis':
        return `/diagnose/${id}`;
      case 'fertilizer_plan':
        return `/fertilizer/${id}`;
      default:
        return `/history`;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-display tracking-tight">
            Namaste, {displayName}!
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-1">
            {activeFarm
              ? `Monitoring plot: ${activeFarm.name} (${activeFarm.district}, ${activeFarm.state})`
              : 'Add your farm to receive live weather-aware advisories.'}
          </p>
        </div>

        {activeFarm && (
          <Link
            to="/advisory/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-sm shadow-sm transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Advisory</span>
          </Link>
        )}
      </div>

      {/* Weather & Active Farm Grid */}
      {isFarmsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : activeFarm ? (
        <div className="space-y-4">
          {/* Weather Card */}
          {isWeatherLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : weather ? (
            <div className="space-y-4">
              <WeatherCard weather={weather} farmName={activeFarm.name} />

              {/* Weather Alerts if any */}
              {weather.alerts && weather.alerts.length > 0 && (
                <WeatherAlertList alerts={weather.alerts} />
              )}

              {/* 7-Day Forecast */}
              {weather.daily && weather.daily.length > 0 && (
                <Card className="p-4 bg-white/70">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    7-Day Precipitation & Temperature Outlook
                  </h4>
                  <ForecastStrip days={weather.daily} />
                </Card>
              )}
            </div>
          ) : (
            <Card className="p-6 bg-stone-50 border-stone-200 text-center">
              <p className="text-sm text-stone-600">
                Weather forecast currently unavailable for this farm coordinates.
              </p>
            </Card>
          )}
        </div>
      ) : (
        /* No Farms State */
        <Card className="p-8 text-center bg-white border-dashed border-2 border-stone-200">
          <MapPin className="w-12 h-12 text-leaf-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900 font-display">No Farm Registered Yet</h3>
          <p className="text-sm text-stone-600 max-w-sm mx-auto mb-4">
            Register your first farm to unlock live Open-Meteo forecasts and localized crop
            guidance.
          </p>
          <Link
            to="/farms/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-leaf-600 text-white font-bold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farm Now</span>
          </Link>
        </Card>
      )}

      {/* Quick Action Tiles */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-stone-900 font-display">AI Agronomy Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/advisory/new"
            className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-leaf-400 hover:shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-leaf-50 text-leaf-700 flex items-center justify-center mb-3 group-hover:bg-leaf-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Crop Advisory</h3>
              <p className="text-xs text-stone-600 mt-1">
                Stage-specific 7-10 day action tasks with weather irrigation alerts.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-leaf-700">
              <span>Generate report</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/diagnose"
            className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-400 hover:shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Pest & Disease</h3>
              <p className="text-xs text-stone-600 mt-1">
                Snap leaf photos to receive biological IPM and organic treatments.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-700">
              <span>Diagnose photo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/fertilizer"
            className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-blue-400 hover:shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Fertilizer Calculator</h3>
              <p className="text-xs text-stone-600 mt-1">
                Deterministic Soil Health Card dosage calculation and split schedule.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-700">
              <span>Calculate bags</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/recommend"
            className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-purple-400 hover:shadow-card transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Crop Planning</h3>
              <p className="text-xs text-stone-600 mt-1">
                Ranked crop recommendations based on soil, budget, and water supply.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-700">
              <span>Plan season</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 font-display">Recent Activity</h2>
          <Link
            to="/history"
            className="text-xs font-bold text-leaf-700 hover:text-leaf-800 flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isHistoryLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : recentItems.length > 0 ? (
          <Card className="p-0 overflow-hidden divide-y divide-stone-100">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                to={getRecordLink(item.record_type, item.id)}
                className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getRecordTypeBadge(item.record_type)}
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 line-clamp-1">
                      {item.title_hint || 'Advisory Record'}
                    </h4>
                    <span className="text-xs text-stone-500">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
              </Link>
            ))}
          </Card>
        ) : (
          <Card className="p-6 text-center text-xs text-stone-500">
            No advisory activity yet. Generate your first advisory above to build your timeline!
          </Card>
        )}
      </div>
    </div>
  );
};
