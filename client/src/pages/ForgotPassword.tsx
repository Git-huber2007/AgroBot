import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Card } from '../components/ui/Card';

const ForgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotInput = z.infer<typeof ForgotSchema>;

export const ForgotPassword: React.FC = () => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(ForgotSchema),
  });

  const onSubmit = async (data: ForgotInput) => {
    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        error(resetError.message || 'Failed to send reset link');
      } else {
        setIsSent(true);
        success('Password reset link sent to your email address.');
      }
    } catch (err: any) {
      error(err.message || 'An error occurred while requesting password reset');
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
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-display text-stone-900">Reset Password</h2>
            <p className="text-sm text-stone-600">
              Enter your email address and we will send you a password recovery link.
            </p>
          </div>

          {isSent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-leaf-50 border border-leaf-200 text-sm text-leaf-900 font-medium text-center">
                Check your inbox for the reset link. Once received, click it to set a new password.
              </div>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Email Address" htmlFor="email" error={errors.email?.message} required>
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  {...register('email')}
                />
              </FormField>

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Send Recovery Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
