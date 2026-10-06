import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Card } from '../components/ui/Card';

const ResetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one digit'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetInput = z.infer<typeof ResetSchema>;

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(ResetSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        error(updateError.message || 'Failed to update password');
      } else {
        success('Password updated successfully! You can now access your dashboard.');
        navigate('/dashboard');
      }
    } catch (err: any) {
      error(err.message || 'An error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soil-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 space-y-6 border-stone-200">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-display text-stone-900">Set New Password</h2>
            <p className="text-sm text-stone-600">Choose a secure password for your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              label="New Password"
              htmlFor="password"
              error={errors.password?.message}
              hint="Minimum 8 characters with letters and numbers"
              required
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
              />
            </FormField>

            <FormField
              label="Confirm New Password"
              htmlFor="confirmPassword"
              error={errors.confirmPassword?.message}
              required
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
            </FormField>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
