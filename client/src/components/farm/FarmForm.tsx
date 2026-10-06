import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FarmCreateSchema,
  INDIAN_STATES,
  SOIL_TYPES,
  IRRIGATION_SOURCES,
  WATER_LEVELS,
  FARMING_PRACTICES,
  AREA_UNITS,
  type FarmCreateInput,
} from '@cropsage/shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FormField } from '../ui/FormField';
import { LocationPicker } from './LocationPicker';
import { SoilTestFields } from './SoilTestFields';
import type { Farm } from '../../hooks/useActiveFarm';

export interface FarmFormProps {
  initialValues?: Partial<Farm>;
  onSubmit: (data: FarmCreateInput) => Promise<void>;
  isLoading?: boolean;
}

export const FarmForm: React.FC<FarmFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
}) => {
  const [lat, setLat] = useState<number | null>(initialValues?.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initialValues?.longitude ?? null);

  const [soilValues, setSoilValues] = useState({
    soil_n: initialValues?.soil_n ?? null,
    soil_p: initialValues?.soil_p ?? null,
    soil_k: initialValues?.soil_k ?? null,
    soil_ph: initialValues?.soil_ph ?? null,
    soil_oc: initialValues?.soil_oc ?? null,
    soil_ec: initialValues?.soil_ec ?? null,
    soil_test_date: initialValues?.soil_test_date ?? null,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FarmCreateInput>({
    resolver: zodResolver(FarmCreateSchema),
    defaultValues: {
      name: initialValues?.name || '',
      state: initialValues?.state || 'Maharashtra',
      district: initialValues?.district || '',
      village: initialValues?.village || '',
      area_value: initialValues?.area_value ? Number(initialValues.area_value) : 2.5,
      area_unit: initialValues?.area_unit || 'acre',
      soil_type: (initialValues?.soil_type as any) || 'black_cotton',
      irrigation_source: (initialValues?.irrigation_source as any) || 'borewell',
      water_availability: (initialValues?.water_availability as any) || 'moderate',
      farming_practice: (initialValues?.farming_practice as any) || 'conventional',
      is_default: initialValues?.is_default ?? true,
    },
  });

  const handleFormSubmit = async (formData: FarmCreateInput) => {
    const payload: FarmCreateInput = {
      ...formData,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
      soil_n: soilValues.soil_n ?? undefined,
      soil_p: soilValues.soil_p ?? undefined,
      soil_k: soilValues.soil_k ?? undefined,
      soil_ph: soilValues.soil_ph ?? undefined,
      soil_oc: soilValues.soil_oc ?? undefined,
      soil_ec: soilValues.soil_ec ?? undefined,
      soil_test_date: soilValues.soil_test_date ?? undefined,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Farm / Plot Name" htmlFor="name" error={errors.name?.message} required>
          <Input id="name" placeholder="e.g. North Field, Mango Orchard" {...register('name')} />
        </FormField>

        <FormField label="State / UT" htmlFor="state" error={errors.state?.message} required>
          <Select id="state" {...register('state')}>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="District" htmlFor="district" error={errors.district?.message} required>
          <Input id="district" placeholder="e.g. Pune, Nashik, Karnal" {...register('district')} />
        </FormField>

        <FormField label="Village / Locality (Optional)" htmlFor="village" error={errors.village?.message}>
          <Input id="village" placeholder="e.g. Baramati" {...register('village')} />
        </FormField>
      </div>

      <LocationPicker
        latitude={lat}
        longitude={lng}
        onChange={(newLat, newLng) => {
          setLat(newLat);
          setLng(newLng);
          setValue('latitude', newLat ?? undefined);
          setValue('longitude', newLng ?? undefined);
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Total Area" htmlFor="area_value" error={errors.area_value?.message} required>
          <Input
            id="area_value"
            type="number"
            step="0.01"
            min="0.01"
            max="10000"
            placeholder="e.g. 5.0"
            {...register('area_value', { valueAsNumber: true })}
          />
        </FormField>

        <FormField label="Area Unit" htmlFor="area_unit" error={errors.area_unit?.message} required>
          <Select id="area_unit" {...register('area_unit')}>
            {AREA_UNITS.map((u) => (
              <option key={u} value={u}>
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Soil Type" htmlFor="soil_type" error={errors.soil_type?.message} required>
          <Select id="soil_type" {...register('soil_type')}>
            {SOIL_TYPES.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Irrigation Source"
          htmlFor="irrigation_source"
          error={errors.irrigation_source?.message}
          required
        >
          <Select id="irrigation_source" {...register('irrigation_source')}>
            {IRRIGATION_SOURCES.map((is) => (
              <option key={is} value={is}>
                {is.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Water Availability"
          htmlFor="water_availability"
          error={errors.water_availability?.message}
          required
        >
          <Select id="water_availability" {...register('water_availability')}>
            {WATER_LEVELS.map((wl) => (
              <option key={wl} value={wl}>
                {wl.charAt(0).toUpperCase() + wl.slice(1)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Farming Practice"
          htmlFor="farming_practice"
          error={errors.farming_practice?.message}
          required
        >
          <Select id="farming_practice" {...register('farming_practice')}>
            {FARMING_PRACTICES.map((fp) => (
              <option key={fp} value={fp}>
                {fp.charAt(0).toUpperCase() + fp.slice(1)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <SoilTestFields
        values={soilValues}
        onChange={(updated) => setSoilValues((prev) => ({ ...prev, ...updated }))}
      />

      <div className="flex items-center gap-2 pt-2">
        <input
          id="is_default"
          type="checkbox"
          className="w-4 h-4 rounded text-leaf-600 focus:ring-leaf-500 border-stone-300"
          {...register('is_default')}
        />
        <label htmlFor="is_default" className="text-sm font-semibold text-stone-800">
          Set as my default active farm
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
        <Button type="submit" isLoading={isLoading} size="lg">
          {initialValues ? 'Update Farm' : 'Save Farm'}
        </Button>
      </div>
    </form>
  );
};
