import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ProfileUpdateSchema,
  INDIAN_STATES,
  APP_LANGUAGES,
  type ProfileUpdateInput,
} from '@cropsage/shared';
import { User, Globe, Lock, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FormField } from '../components/ui/FormField';
import { Dialog } from '../components/ui/Dialog';

export const Settings: React.FC = () => {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Profile Form
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
    setIsUpdatingProfile(true);
    try {
      await api.patch('/me', data);
      await refreshProfile();
      success('Profile updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        error(updateError.message || 'Failed to change password');
      } else {
        success('Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      error('Please enter your password to confirm deletion.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.delete('/me', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      await signOut();
      success('Your account and all associated farm data have been permanently removed.');
      navigate('/');
    } catch (err: any) {
      error(err.message || 'Failed to delete account. Please verify password.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSignOutAll = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      await signOut();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Account & Settings"
        subtitle="Manage your profile, language, credentials, and data privacy settings."
      />

      {/* Profile Section */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200">
          <User className="w-5 h-5 text-leaf-600" />
          <h3 className="text-lg font-bold text-stone-900 font-display">Personal Profile</h3>
        </div>

        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
          <FormField label="Full Name" htmlFor="full_name" error={errors.full_name?.message} required>
            <Input id="full_name" {...register('full_name')} />
          </FormField>

          <FormField
            label="Mobile Phone Number"
            htmlFor="phone"
            error={errors.phone?.message}
            hint="For crop advisory alerts and field updates"
          >
            <Input id="phone" type="tel" {...register('phone')} />
          </FormField>

          <FormField
            label="Preferred Advisory Language"
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
              <Input id="district" {...register('district')} />
            </FormField>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isUpdatingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Password */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200">
          <Lock className="w-5 h-5 text-stone-600" />
          <h3 className="text-lg font-bold text-stone-900 font-display">Security & Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="New Password" htmlFor="new_password" required>
              <Input
                id="new_password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </FormField>

            <FormField label="Confirm New Password" htmlFor="confirm_password" required>
              <Input
                id="confirm_password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOutAll}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out On All Devices
            </Button>

            <Button type="submit" isLoading={isChangingPassword} disabled={!newPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Data Retention & Privacy Notice */}
      <Card className="p-6 bg-stone-50 border-stone-200 space-y-2 text-xs text-stone-600">
        <div className="flex items-center gap-2 font-bold text-stone-800 text-sm">
          <ShieldCheck className="w-4 h-4 text-leaf-600" />
          <span>Privacy & Data Sovereignty Policy</span>
        </div>
        <p>
          CropSage AI isolates all farm coordinates, soil-test values, and advisory records using
          PostgreSQL Row-Level Security (RLS). Images uploaded for pest diagnosis have EXIF GPS
          metadata stripped before cloud storage and are preserved only in a private bucket accessible
          exclusively to your account.
        </p>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 sm:p-8 border-red-200 bg-red-50/20 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-red-950 font-display">Danger Zone</h3>
        </div>

        <p className="text-sm text-stone-700">
          Permanently delete your user profile, all registered farm plots, soil records, past
          advisories, and uploaded photos. This action is irreversible.
        </p>

        <Button
          type="button"
          variant="danger"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete My Account Permanently
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Confirm Account Deletion"
        description="To proceed, please enter your password. All your farm data and images will be permanently wiped."
      >
        <div className="space-y-4 pt-2">
          <FormField label="Your Password" htmlFor="delete_password" required>
            <Input
              id="delete_password"
              type="password"
              placeholder="••••••••"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isDeletingAccount}
              onClick={handleDeleteAccount}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
