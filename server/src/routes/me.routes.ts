import { Router } from 'express';
import { DeleteAccountSchema, ProfileUpdateSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { authSensitiveLimiter } from '../middleware/rateLimiters.js';
import { AccountService } from '../services/account.service.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

import { supabaseAdmin } from '../db/adminClient.js';

export const meRouter = Router();

// GET /me
meRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    let { data: profile, error } = await req.supabase!
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .maybeSingle();

    if (!profile) {
      // Lazy auto-create with admin client if trigger has not executed
      const { data: created, error: createErr } = await supabaseAdmin
        .from('profiles')
        .insert({ id: req.user!.id })
        .select('*')
        .maybeSingle();

      if (!createErr && created) {
        profile = created;
      }
    }

    if (error || !profile) {
      throw new NotFoundError('User profile not found.');
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

// PATCH /me
meRouter.patch(
  '/me',
  requireAuth,
  validate({ body: ProfileUpdateSchema }),
  async (req, res, next) => {
    try {
      const { data: profile, error } = await req.supabase!
        .from('profiles')
        .update(req.body)
        .eq('id', req.user!.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      res.json({ data: profile });
    } catch (err) {
      next(err);
    }
  },
);

// POST /me/onboarding/complete
meRouter.post('/me/onboarding/complete', requireAuth, async (req, res, next) => {
  try {
    const { count, error: countErr } = await req.supabase!
      .from('farms')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user!.id);

    if (countErr) {
      throw new Error(`Failed to check farms: ${countErr.message}`);
    }

    if (!count || count < 1) {
      throw new ValidationError('At least one farm must be created before completing onboarding.');
    }

    const { data: profile, error: updateErr } = await req.supabase!
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', req.user!.id)
      .select('*')
      .single();

    if (updateErr) {
      throw new Error(`Failed to complete onboarding: ${updateErr.message}`);
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

// DELETE /me
meRouter.delete(
  '/me',
  requireAuth,
  authSensitiveLimiter,
  validate({ body: DeleteAccountSchema }),
  async (req, res, next) => {
    try {
      await AccountService.deleteAccount(
        req.user!.id,
        req.user!.email || '',
        req.body.password,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
