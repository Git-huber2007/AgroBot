import { Router } from 'express';
import { AdvisoryRequestSchema, IdParamSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { aiHourlyLimiter } from '../middleware/rateLimiters.js';
import { checkAiDailyQuota } from '../middleware/aiQuota.js';
import { AdvisoryService } from '../services/advisory.service.js';
import { NotFoundError } from '../utils/errors.js';

export const advisoriesRouter = Router();

// POST /advisories
advisoriesRouter.post(
  '/advisories',
  requireAuth,
  aiHourlyLimiter,
  checkAiDailyQuota,
  validate({ body: AdvisoryRequestSchema }),
  async (req, res, next) => {
    try {
      const result = await AdvisoryService.generateAdvisory(
        req.supabase!,
        req.user!.id,
        req.requestId || 'req-' + Date.now(),
        req.body,
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// GET /advisories/:id
advisoriesRouter.get(
  '/advisories/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { data: advisory, error } = await req.supabase!
        .from('crop_advisories')
        .select('*, crops(name_en), farms(name)')
        .eq('id', req.params.id)
        .maybeSingle();

      if (error || !advisory) {
        throw new NotFoundError('Crop advisory not found.');
      }

      res.json({
        data: {
          ...advisory,
          farm_name: advisory.farms?.name,
          crop_name: advisory.crops?.name_en,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /advisories/:id
advisoriesRouter.delete(
  '/advisories/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { error } = await req.supabase!
        .from('crop_advisories')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        throw new Error(`Failed to delete advisory: ${error.message}`);
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
