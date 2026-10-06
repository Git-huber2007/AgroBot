import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RecommendationRequestSchema,
  SEASONS,
  WATER_LEVELS,
  APP_LANGUAGES,
  type RecommendationRequestInput,
} from '@cropsage/shared';
import { useActiveFarm } from '../hooks/useActiveFarm';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FormField } from '../components/ui/FormField';
import { CropSelect, type Crop } from '../components/farm/CropSelect';
import { AILoadingPanel } from '../components/ui/AILoadingPanel';

export const Recommend: React.FC = () => {
  const navigate = useNavigate();
  const { activeFarm, farms } = useActiveFarm();
  const { profile } = useAuth();
  const { error } = useToast();

  const [prevCrop, setPrevCrop] = useState<Crop | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RecommendationRequestInput>({
    resolver: zodResolver(RecommendationRequestSchema),
    defaultValues: {
      farm_id: activeFarm?.id || '',
      season: 'kharif',
      sowing_month: currentMonth,
      water_availability: (activeFarm?.water_availability as any) || 'moderate',
      budget_min_inr_per_acre: 10000,
      budget_max_inr_per_acre: 35000,
      risk_appetite: 'medium',
      market_access: 'mandi',
      language: (profile?.preferred_language as any) || 'en',
    },
  });

  const onSubmit = async (data: RecommendationRequestInput) => {
    setIsGenerating(true);
    try {
      const res = await api.post<{ id: string }>('/recommendations', data);
      navigate(`/recommend/${res.id}`);
    } catch (err: any) {
      setIsGenerating(false);
      error(err.message || 'Failed to generate recommendations. Please try again.');
    }
  };

  if (!activeFarm && farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">No Farm Registered</h2>
        <p className="text-sm text-stone-600">
          Please add a farm first so we can analyze your soil, rainfall, and irrigation.
        </p>
        <Button onClick={() => navigate('/farms/new')}>Add Your First Farm</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Seasonal Crop Recommendations"
        subtitle="Discover the 3–5 most suitable crops for your soil, water availability, and budget."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Crop Recommendation' },
        ]}
      />

      {isGenerating ? (
        <AILoadingPanel
          title="Synthesizing Seasonal Crop Recommendations..."
          tips={[
            'Filtering candidate crops suitable for this agro-climatic zone...',
            'Evaluating soil drainage, texture, and nutrient baseline...',
            'Checking crop rotation advantages against previous crop...',
            'Assessing input cost feasibility within specified budget...',
            'Ranking crops by net suitability score...',
          ]}
        />
      ) : (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Target Farm Context */}
            <div className="p-4 bg-sun-50/60 rounded-xl border border-sun-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sun-800">
                  Target Farm
                </span>
                <h4 className="text-base font-bold text-stone-900">
                  {activeFarm?.name} ({activeFarm?.district}, {activeFarm?.state})
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Soil: {activeFarm?.soil_type.replace(/_/g, ' ')} • Irrigation:{' '}
                  {activeFarm?.irrigation_source.replace(/_/g, ' ')}
                </p>
              </div>
              <input type="hidden" value={activeFarm?.id} {...register('farm_id')} />
            </div>

            {/* Season & Sowing Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Target Season" htmlFor="season" error={errors.season?.message} required>
                <Select id="season" {...register('season')}>
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Planned Sowing Month"
                htmlFor="sowing_month"
                error={errors.sowing_month?.message}
                required
              >
                <Select
                  id="sowing_month"
                  {...register('sowing_month', { valueAsNumber: true })}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Water & Market Access */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Water Availability"
                htmlFor="water_availability"
                error={errors.water_availability?.message}
                required
              >
                <Select id="water_availability" {...register('water_availability')}>
                  {WATER_LEVELS.map((w) => (
                    <option key={w} value={w}>
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Market Access / Selling Channel"
                htmlFor="market_access"
                error={errors.market_access?.message}
                required
              >
                <Select id="market_access" {...register('market_access')}>
                  <option value="mandi">APMC Mandi (Wholesale Market)</option>
                  <option value="local">Local Village / Town Market</option>
                  <option value="contract">Contract Farming Buyer</option>
                  <option value="export">Export Channel</option>
                </Select>
              </FormField>
            </div>

            {/* Budget Range (INR per acre) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Min Budget (₹ / acre)"
                htmlFor="budget_min_inr_per_acre"
                error={errors.budget_min_inr_per_acre?.message}
                required
              >
                <Input
                  id="budget_min_inr_per_acre"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 10000"
                  {...register('budget_min_inr_per_acre', { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Max Budget (₹ / acre)"
                htmlFor="budget_max_inr_per_acre"
                error={errors.budget_max_inr_per_acre?.message}
                required
              >
                <Input
                  id="budget_max_inr_per_acre"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 35000"
                  {...register('budget_max_inr_per_acre', { valueAsNumber: true })}
                />
              </FormField>
            </div>

            {/* Risk Appetite & Previous Crop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Risk Tolerance"
                htmlFor="risk_appetite"
                error={errors.risk_appetite?.message}
                required
              >
                <Select id="risk_appetite" {...register('risk_appetite')}>
                  <option value="low">Low (Dependable staple crops)</option>
                  <option value="medium">Medium (Balanced reward & volatility)</option>
                  <option value="high">High (High-value horticultural / cash crops)</option>
                </Select>
              </FormField>

              <FormField
                label="Previous Crop in this Plot (For Rotation)"
                htmlFor="previous_crop_id"
                error={errors.previous_crop_id?.message}
              >
                <CropSelect
                  value={prevCrop?.id}
                  onChange={(id, crop) => {
                    setPrevCrop(crop);
                    setValue('previous_crop_id', id);
                  }}
                />
              </FormField>
            </div>

            {/* Language */}
            <FormField label="Output Language" htmlFor="language" error={errors.language?.message} required>
              <Select id="language" {...register('language')}>
                {APP_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Get Ranked Crop Recommendations
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
