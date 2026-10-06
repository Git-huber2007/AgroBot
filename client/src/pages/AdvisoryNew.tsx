import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AdvisoryRequestSchema,
  SEASONS,
  APP_LANGUAGES,
  type AdvisoryRequestInput,
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
import { Textarea } from '../components/ui/Textarea';
import { FormField } from '../components/ui/FormField';
import { CropSelect, type Crop } from '../components/farm/CropSelect';
import { GrowthStageSelect } from '../components/farm/GrowthStageSelect';
import { AILoadingPanel } from '../components/ui/AILoadingPanel';

export const AdvisoryNew: React.FC = () => {
  const navigate = useNavigate();
  const { activeFarm, farms } = useActiveFarm();
  const { profile } = useAuth();
  const { error } = useToast();

  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdvisoryRequestInput>({
    resolver: zodResolver(AdvisoryRequestSchema),
    defaultValues: {
      farm_id: activeFarm?.id || '',
      crop_id: 1, // Default to Paddy (ID 1 in seed catalog)
      variety: '',
      sowing_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
      growth_stage: 'tillering',
      season: 'kharif',
      concern: '',
      language: (profile?.preferred_language as any) || 'en',
    },
  });

  const watchSowingDate = watch('sowing_date');
  const watchGrowthStage = watch('growth_stage');

  React.useEffect(() => {
    if (activeFarm?.id) {
      setValue('farm_id', activeFarm.id);
    }
  }, [activeFarm?.id, setValue]);

  const onSubmit = async (data: AdvisoryRequestInput) => {
    const targetFarmId = activeFarm?.id || data.farm_id;
    if (!targetFarmId) {
      error('Please select an active farm plot before generating an advisory.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post<{ id: string }>('/advisories', {
        ...data,
        farm_id: targetFarmId,
      });
      navigate(`/advisory/${response.id}`);
    } catch (err: any) {
      setIsGenerating(false);
      error(err.message || 'Failed to generate advisory. Please try again.');
    }
  };

  if (!activeFarm && farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">No Farm Registered</h2>
        <p className="text-sm text-stone-600">
          You must register at least one farm plot before generating tailored crop advisories.
        </p>
        <Button onClick={() => navigate('/farms/new')}>Add Your First Farm</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Generate Stage-Specific Crop Advisory"
        subtitle="Get weather-grounded 7-10 day tasks, irrigation schedules, and nutrient guidance."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'New Advisory' },
        ]}
      />

      {isGenerating ? (
        <AILoadingPanel
          title="Analyzing Weather & Crop Context..."
          tips={[
            'Pulling live 7-day Open-Meteo precipitation forecast...',
            'Calculating days after sowing and thermal heat units...',
            'Matching soil test parameters with crop nutrient requirements...',
            'Evaluating integrated pest management thresholds...',
            'Formatting clear, actionable guidance in your chosen language...',
          ]}
        />
      ) : (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Active Farm Display */}
            <div className="p-4 bg-leaf-50/60 rounded-xl border border-leaf-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-leaf-800">
                  Target Plot
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

            {/* Crop Selector */}
            <FormField label="Select Crop" htmlFor="crop_id" error={errors.crop_id?.message} required>
              <CropSelect
                value={selectedCrop?.id}
                onChange={(id, crop) => {
                  setSelectedCrop(crop);
                  setValue('crop_id', id);
                  if (crop.growth_stages.length > 0 && crop.growth_stages[0]) {
                    setValue('growth_stage', crop.growth_stages[0].key);
                  }
                }}
                hasError={!!errors.crop_id}
              />
            </FormField>

            {/* Variety & Season Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Crop Variety (Optional)"
                htmlFor="variety"
                error={errors.variety?.message}
              >
                <Input
                  id="variety"
                  placeholder="e.g. Sona Masoori, PBW-343"
                  {...register('variety')}
                />
              </FormField>

              <FormField label="Current Season" htmlFor="season" error={errors.season?.message} required>
                <Select id="season" {...register('season')}>
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Sowing Date & Growth Stage Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Sowing Date"
                htmlFor="sowing_date"
                error={errors.sowing_date?.message}
                required
              >
                <Input
                  id="sowing_date"
                  type="date"
                  max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  {...register('sowing_date')}
                />
              </FormField>

              <FormField
                label="Current Growth Stage"
                htmlFor="growth_stage"
                error={errors.growth_stage?.message}
                required
              >
                <GrowthStageSelect
                  crop={selectedCrop}
                  sowingDate={watchSowingDate}
                  value={watchGrowthStage}
                  onChange={(stageKey) => setValue('growth_stage', stageKey)}
                  hasError={!!errors.growth_stage}
                />
              </FormField>
            </div>

            {/* Specific Concern Free-Text */}
            <FormField
              label="Specific Observation or Concern (Optional)"
              htmlFor="concern"
              error={errors.concern?.message}
              hint="Max 500 characters. e.g. Notice slight yellowing of bottom leaves after recent rainfall."
            >
              <Textarea
                id="concern"
                maxLength={500}
                placeholder="Describe any pest spots, leaf color changes, or weather worries..."
                {...register('concern')}
              />
            </FormField>

            {/* Output Language */}
            <FormField
              label="Advisory Output Language"
              htmlFor="language"
              error={errors.language?.message}
              required
            >
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
                Generate 7-Day Advisory
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
