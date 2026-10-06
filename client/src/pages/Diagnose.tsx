import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AFFECTED_PARTS,
  APP_LANGUAGES,
  type DiagnosisRequestInput,
} from '@cropsage/shared';
import { useActiveFarm } from '../hooks/useActiveFarm';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { FormField } from '../components/ui/FormField';
import { CropSelect, type Crop } from '../components/farm/CropSelect';
import { ImageUploader } from '../components/diagnosis/ImageUploader';
import { AILoadingPanel } from '../components/ui/AILoadingPanel';

export const Diagnose: React.FC = () => {
  const navigate = useNavigate();
  const { activeFarm } = useActiveFarm();
  const { profile } = useAuth();
  const { error } = useToast();

  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{
    crop_id: number;
    affected_part: string;
    symptoms: string;
    language: string;
  }>({
    defaultValues: {
      crop_id: 1, // Default to Paddy
      affected_part: 'leaf',
      symptoms: '',
      language: (profile?.preferred_language as any) || 'en',
    },
  });

  const watchSymptoms = watch('symptoms');

  const onSubmit = async (formData: any) => {
    setValidationError(null);

    // Rule: at least 1 image OR symptoms >= 20 chars
    if (images.length === 0 && (!formData.symptoms || formData.symptoms.trim().length < 20)) {
      setValidationError('Please upload at least 1 clear photo OR describe symptoms in at least 20 characters.');
      return;
    }

    setIsDiagnosing(true);

    try {
      const payload: DiagnosisRequestInput = {
        farm_id: activeFarm?.id || undefined,
        crop_id: formData.crop_id,
        affected_part: formData.affected_part,
        symptoms: formData.symptoms ? formData.symptoms.trim() : undefined,
        language: formData.language,
        imageCount: images.length,
      };

      const multipartData = new FormData();
      multipartData.append('payload', JSON.stringify(payload));
      for (const file of images) {
        multipartData.append('images', file);
      }

      const res = await api.post<{ id: string }>('/diagnoses', multipartData);
      navigate(`/diagnose/${res.id}`);
    } catch (err: any) {
      setIsDiagnosing(false);
      error(err.message || 'Diagnosis failed. Please verify image clarity and try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Pest & Disease Visual Diagnosis"
        subtitle="Upload leaf/stem photos and receive Integrated Pest Management (IPM) treatment guidance."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Pest Diagnosis' },
        ]}
      />

      {isDiagnosing ? (
        <AILoadingPanel
          title="Analyzing Plant Symptoms with Multimodal AI..."
          tips={[
            'Inspecting image resolution and checking for plant tissue indicators...',
            'Comparing visual lesions against regional fungal and bacterial patterns...',
            'Evaluating pest morphology and feeding damage symptoms...',
            'Synthesizing IPM cultural and organic treatment options...',
            'Ensuring safety precautions and withholding periods...',
          ]}
        />
      ) : (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Target Farm */}
            {activeFarm && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                <span>
                  Active Farm Context: <strong>{activeFarm.name}</strong> ({activeFarm.district})
                </span>
                <span className="font-semibold text-leaf-700 capitalize">
                  {activeFarm.farming_practice} Practice
                </span>
              </div>
            )}

            {/* Crop Selector */}
            <FormField label="Affected Crop" htmlFor="crop_id" error={errors.crop_id?.message} required>
              <CropSelect
                value={selectedCrop?.id}
                onChange={(id, crop) => {
                  setSelectedCrop(crop);
                  setValue('crop_id', id);
                }}
                hasError={!!errors.crop_id}
              />
            </FormField>

            {/* Affected Part */}
            <FormField
              label="Affected Plant Part"
              htmlFor="affected_part"
              error={errors.affected_part?.message}
              required
            >
              <Select id="affected_part" {...register('affected_part')}>
                {AFFECTED_PARTS.map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Image Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-800 block">
                Plant Photos (Up to 3 images)
              </label>
              <ImageUploader files={images} onChange={setImages} maxFiles={3} />
            </div>

            {/* Symptoms Description */}
            <FormField
              label="Describe What You Observe"
              htmlFor="symptoms"
              error={errors.symptoms?.message}
              hint="e.g. Yellow spots with brown borders on lower leaves, curling edges, white powder on underside."
            >
              <Textarea
                id="symptoms"
                maxLength={800}
                placeholder="Describe leaf spots, wilting, insect damage, or discoloration..."
                {...register('symptoms')}
              />
            </FormField>

            {validationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                {validationError}
              </div>
            )}

            {/* Output Language */}
            <FormField label="Diagnosis Language" htmlFor="language" error={errors.language?.message} required>
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
                Diagnose Plant Health
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
