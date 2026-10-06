import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FertilizerRequestSchema,
  FERTILIZER_PRODUCTS,
  APP_LANGUAGES,
  type FertilizerRequestInput,
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

export const Fertilizer: React.FC = () => {
  const navigate = useNavigate();
  const { activeFarm, farms } = useActiveFarm();
  const { profile } = useAuth();
  const { error } = useToast();

  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedFertilizers, setSelectedFertilizers] = useState<string[]>([
    'urea',
    'dap',
    'mop',
  ]);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FertilizerRequestInput>({
    resolver: zodResolver(FertilizerRequestSchema),
    defaultValues: {
      farm_id: activeFarm?.id || '',
      crop_id: 1, // Default to Paddy
      area_hectares: activeFarm?.area_hectares || 1.0,
      target_yield_t_ha: undefined,
      available_fertilizers: ['urea', 'dap', 'mop'] as any,
      soil_n: activeFarm?.soil_n ? Number(activeFarm.soil_n) : undefined,
      soil_p: activeFarm?.soil_p ? Number(activeFarm.soil_p) : undefined,
      soil_k: activeFarm?.soil_k ? Number(activeFarm.soil_k) : undefined,
      language: (profile?.preferred_language as any) || 'en',
    },
  });

  useEffect(() => {
    if (activeFarm) {
      setValue('farm_id', activeFarm.id);
      setValue('area_hectares', activeFarm.area_hectares);
      if (activeFarm.soil_n) setValue('soil_n', Number(activeFarm.soil_n));
      if (activeFarm.soil_p) setValue('soil_p', Number(activeFarm.soil_p));
      if (activeFarm.soil_k) setValue('soil_k', Number(activeFarm.soil_k));
    }
  }, [activeFarm, setValue]);

  const toggleFertilizer = (key: string) => {
    const updated = selectedFertilizers.includes(key)
      ? selectedFertilizers.filter((k) => k !== key)
      : [...selectedFertilizers, key];

    if (updated.length > 0) {
      setSelectedFertilizers(updated);
      setValue('available_fertilizers', updated as any);
    }
  };

  const onSubmit = async (data: FertilizerRequestInput) => {
    setIsCalculating(true);
    try {
      const res = await api.post<{ id: string }>('/fertilizer-plans', data);
      navigate(`/fertilizer/${res.id}`);
    } catch (err: any) {
      setIsCalculating(false);
      error(err.message || 'Calculation failed. Please check inputs and retry.');
    }
  };

  if (!activeFarm && farms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900 font-display">No Farm Registered</h2>
        <p className="text-sm text-stone-600">
          Please add a farm plot first to calculate soil-adjusted fertilizer quantities.
        </p>
        <Button onClick={() => navigate('/farms/new')}>Add Your First Farm</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Soil-Health-Card Fertilizer Calculator"
        subtitle="Deterministic nutrient mathematics adjusted for soil ratings, plus AI split application timing."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Fertilizer Calculator' },
        ]}
      />

      {isCalculating ? (
        <AILoadingPanel
          title="Computing Balanced Fertilizer Dosages..."
          tips={[
            'Retrieving state-level national NPK recommendations for crop...',
            'Adjusting for soil test ratings (Low: +25%, Medium: 0%, High: -25%)...',
            'Solving nutrient matrix across selected fertilizer sources...',
            'Converting into exact kilogram totals and 50-kg bag equivalents...',
            'Synthesizing stage-specific basal and top-dressing split schedule...',
          ]}
        />
      ) : (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Plot Context */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  Target Farm
                </span>
                <h4 className="text-base font-bold text-stone-900">{activeFarm?.name}</h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  Area: {activeFarm?.area_value} {activeFarm?.area_unit} ({activeFarm?.area_hectares} ha)
                </p>
              </div>
              <input type="hidden" value={activeFarm?.id} {...register('farm_id')} />
            </div>

            {/* Crop Selector */}
            <FormField label="Target Crop" htmlFor="crop_id" error={errors.crop_id?.message} required>
              <CropSelect
                value={selectedCrop?.id}
                onChange={(id, crop) => {
                  setSelectedCrop(crop);
                  setValue('crop_id', id);
                }}
                hasError={!!errors.crop_id}
              />
            </FormField>

            {/* Area & Target Yield */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Plot Area (Hectares)"
                htmlFor="area_hectares"
                error={errors.area_hectares?.message}
                required
              >
                <Input
                  id="area_hectares"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('area_hectares', { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Target Yield (t/ha, Optional)"
                htmlFor="target_yield_t_ha"
                error={errors.target_yield_t_ha?.message}
                hint="Leave blank for typical average yield"
              >
                <Input
                  id="target_yield_t_ha"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 5.5"
                  {...register('target_yield_t_ha', {
                    setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
                  })}
                />
              </FormField>
            </div>

            {/* Soil Lab Values */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Soil Test Values (kg/ha) — Leave blank if unknown
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Nitrogen (N)" htmlFor="soil_n" error={errors.soil_n?.message}>
                  <Input
                    id="soil_n"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 250"
                    {...register('soil_n', {
                      setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
                    })}
                  />
                </FormField>

                <FormField label="Phosphorus (P)" htmlFor="soil_p" error={errors.soil_p?.message}>
                  <Input
                    id="soil_p"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15"
                    {...register('soil_p', {
                      setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
                    })}
                  />
                </FormField>

                <FormField label="Potassium (K)" htmlFor="soil_k" error={errors.soil_k?.message}>
                  <Input
                    id="soil_k"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 160"
                    {...register('soil_k', {
                      setValueAs: (v) => (v === '' ? undefined : parseFloat(v)),
                    })}
                  />
                </FormField>
              </div>
            </div>

            {/* Available Fertilizers Checklist */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-800 block">
                Available Fertilizer Products in Your Local Depot (Select at least 1)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FERTILIZER_PRODUCTS.map((prod) => {
                  const isChecked = selectedFertilizers.includes(prod.key);
                  return (
                    <button
                      key={prod.key}
                      type="button"
                      onClick={() => toggleFertilizer(prod.key)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors min-h-[44px] ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 pointer-events-none"
                      />
                      <span className="truncate">{prod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output Language */}
            <FormField label="Schedule Language" htmlFor="language" error={errors.language?.message} required>
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
                Calculate Nutrient Plan
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
