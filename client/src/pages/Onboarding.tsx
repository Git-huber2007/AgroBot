import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ProfileUpdateSchema,
  INDIAN_STATES,
  APP_LANGUAGES,
  type ProfileUpdateInput,
  type FarmCreateInput,
} from '@cropsage/shared';
import { Sprout, Check, User, MapPin, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FormField } from '../components/ui/FormField';
import { Card } from '../components/ui/Card';
import { FarmForm } from '../components/farm/FarmForm';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdFarm, setCreatedFarm] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, refreshProfile } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Step 1: Profile form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      preferred_language: (profile?.preferred_language as any) || 'en',
      state: profile?.state || 'Maharashtra',
      district: profile?.district || '',
    },
  });

  const onProfileSubmit = async (data: ProfileUpdateInput) => {
    setIsSubmitting(true);
    try {
      await api.patch('/me', data);
      await refreshProfile();
      success('Profile details saved.');
      setStep(2);
    } catch (err: any) {
      error(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFarmSubmit = async (data: FarmCreateInput) => {
    setIsSubmitting(true);
    try {
      const farm = await api.post<any>('/farms', data);
      setCreatedFarm(farm);
      success('First farm registered successfully!');
      setStep(3);
    } catch (err: any) {
      error(err.message || 'Failed to create farm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCompleteOnboarding = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/me/onboarding/complete', {});
      await refreshProfile();
      success('Setup completed! Welcome to CropSage AI.');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Failed to finalize setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-soil-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-leaf-600 flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-display font-extrabold text-2xl text-stone-900 tracking-tight">
              Crop<span className="text-leaf-600">Sage</span> AI
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 font-display">
            Welcome! Let&apos;s Set Up Your Account
          </h1>
          <p className="text-sm text-stone-600">
            Tailoring agronomy advice to your language, region, and soil conditions.
          </p>
        </div>

        {/* Wizard Progress */}
        <div className="flex items-center justify-between relative max-w-md mx-auto px-6">
          <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-0.5 bg-stone-200 -z-0" />

          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                step > 1
                  ? 'bg-leaf-600 text-white'
                  : step === 1
                  ? 'bg-leaf-600 text-white ring-4 ring-leaf-100'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-xs font-semibold text-stone-700">Profile</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                step > 2
                  ? 'bg-leaf-600 text-white'
                  : step === 2
                  ? 'bg-leaf-600 text-white ring-4 ring-leaf-100'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-xs font-semibold text-stone-700">First Farm</span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                step === 3
                  ? 'bg-leaf-600 text-white ring-4 ring-leaf-100'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              3
            </div>
            <span className="text-xs font-semibold text-stone-700">Confirm</span>
          </div>
        </div>

        {/* Wizard Cards */}
        {step === 1 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200">
              <User className="w-5 h-5 text-leaf-600" />
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-display">Step 1: Your Profile</h3>
                <p className="text-xs text-stone-500">Provide basic contact and regional information</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField label="Full Name" htmlFor="full_name" error={errors.full_name?.message} required>
                <Input
                  id="full_name"
                  placeholder="e.g. Ramesh Kumar Patel"
                  {...register('full_name')}
                />
              </FormField>

              <FormField
                label="Mobile Phone Number (Optional)"
                htmlFor="phone"
                error={errors.phone?.message}
                hint="Used for localized crop SMS alerts"
              >
                <Input id="phone" type="tel" placeholder="+91 9876543210" {...register('phone')} />
              </FormField>

              <FormField
                label="Preferred Language"
                htmlFor="preferred_language"
                error={errors.preferred_language?.message}
                required
              >
                <Select id="preferred_language" {...register('preferred_language')}>
                  {APP_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.name})
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="State / UT" htmlFor="state" error={errors.state?.message} required>
                  <Select id="state" {...register('state')}>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="District" htmlFor="district" error={errors.district?.message} required>
                  <Input id="district" placeholder="e.g. Pune, Indore, Karnal" {...register('district')} />
                </FormField>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isSubmitting} size="lg">
                  Continue to Farm Setup
                </Button>
              </div>
            </form>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200">
              <MapPin className="w-5 h-5 text-leaf-600" />
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-display">Step 2: Add Your First Farm</h3>
                <p className="text-xs text-stone-500">
                  This sets up your default weather and soil context for AI advisory
                </p>
              </div>
            </div>

            <FarmForm onSubmit={onFarmSubmit} isLoading={isSubmitting} />
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-leaf-100 text-leaf-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-stone-900 font-display">
                You Are All Set!
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                Your profile and initial plot context have been configured.
              </p>
            </div>

            {createdFarm && (
              <div className="p-4 bg-soil-50 rounded-xl border border-stone-200 text-left text-sm space-y-1">
                <p className="font-bold text-stone-900">{createdFarm.name}</p>
                <p className="text-xs text-stone-600">
                  Location: {createdFarm.district}, {createdFarm.state}
                </p>
                <p className="text-xs text-stone-600">
                  Area: {createdFarm.area_value} {createdFarm.area_unit} ({createdFarm.soil_type?.replace(/_/g, ' ')})
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={onCompleteOnboarding}
                isLoading={isSubmitting}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
