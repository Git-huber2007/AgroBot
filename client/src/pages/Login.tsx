import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sprout } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FormField } from '../components/ui/FormField';
import { Card } from '../components/ui/Card';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginInput = z.infer<typeof LoginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        error(authError.message || 'Invalid email or password');
        return;
      }

      if (authData.session) {
        await refreshProfile();
        success('Signed in successfully');
        navigate(returnTo);
      }
    } catch (err: any) {
      error(err.message || 'An unexpected error occurred during login');
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
        <h2 className="text-2xl font-bold font-display text-stone-900">Sign in to your account</h2>
        <p className="mt-1 text-sm text-stone-600">
          Or{' '}
          <Link to="/signup" className="font-semibold text-leaf-600 hover:text-leaf-700">
            register a new farm profile
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card border-stone-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label="Email Address" htmlFor="email" error={errors.email?.message} required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="farmer@example.com"
                {...register('email')}
              />
            </FormField>

            <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
              />
            </FormField>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-stone-600 hover:text-leaf-700"
              >
                Forgot your password?
              </Link>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
