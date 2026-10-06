import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const { success, error } = useToast();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      error('Email address is missing');
      return;
    }

    setIsResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        error(resendError.message || 'Failed to resend verification link');
      } else {
        success('Verification email resent. Please check your inbox and spam folder.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to resend verification link');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-soil-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 text-center space-y-5 border-stone-200">
          <div className="w-16 h-16 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold font-display text-stone-900">Check Your Inbox</h2>

          <p className="text-sm text-stone-600 leading-relaxed">
            We have sent an activation link to{' '}
            <strong className="text-stone-900">{email || 'your email address'}</strong>. Please click
            the link in the email to activate your account and start receiving personalized crop
            advisories.
          </p>

          <div className="pt-2 flex flex-col gap-3">
            {email && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                isLoading={isResending}
                leftIcon={<RefreshCw className="w-4 h-4 text-stone-600" />}
                className="w-full"
              >
                Resend Verification Email
              </Button>
            )}

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
