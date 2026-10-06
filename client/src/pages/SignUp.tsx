import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SignUpSchema, type SignUpInput } from '@cropsage/shared';
import { Sprout } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Card } from '../components/ui/Card';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        error(authError.message || 'Registration failed');
        return;
      }

      // If user session is returned immediately (e.g. email confirmation disabled in local dev)
      if (authData.session) {
        navigate('/onboarding');
      } else {
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err: any) {
      error(err.message || 'An unexpected error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soil-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-leaf-600 flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-6 h-6" />
          </div>
          <span className="font-display font-extrabold text-2xl text-stone-900 tracking-tight">
            Crop<span className="text-leaf-600">Sage</span> AI
          </span>
        </Link>
        <h2 className="text-2xl font-bold font-display text-stone-900">Create your account</h2>
        <p className="mt-1 text-sm text-stone-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-leaf-600 hover:text-leaf-700">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card border-stone-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Email Address" htmlFor="email" error={errors.email?.message} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="farmer@example.com"
                {...register('email')}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              hint="Must be at least 8 characters with letters and numbers"
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
              label="Confirm Password"
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

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Create Account
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
