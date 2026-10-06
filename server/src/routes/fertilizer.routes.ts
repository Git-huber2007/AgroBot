import { Router } from 'express';
import { FertilizerRequestSchema, IdParamSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { aiHourlyLimiter } from '../middleware/rateLimiters.js';
import { checkAiDailyQuota } from '../middleware/aiQuota.js';
import { FertilizerService } from '../services/fertilizer.service.js';
import { NotFoundError } from '../utils/errors.js';

export const fertilizerRouter = Router();

// POST /fertilizer-plans
fertilizerRouter.post(
  '/fertilizer-plans',
  requireAuth,
  aiHourlyLimiter,
  checkAiDailyQuota,
  validate({ body: FertilizerRequestSchema }),
  async (req, res, next) => {
    try {
      const result = await FertilizerService.createPlan(
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

// GET /fertilizer-plans/:id
fertilizerRouter.get(
  '/fertilizer-plans/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { data: plan, error } = await req.supabase!
        .from('fertilizer_plans')
        .select('*, crops(name_en), farms(name)')
        .eq('id', req.params.id)
        .maybeSingle();

      if (error || !plan) {
        throw new NotFoundError('Fertilizer plan not found.');
      }

      res.json({
        data: {
          ...plan,
          farm_name: plan.farms?.name,
          crop_name: plan.crops?.name_en,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /fertilizer-plans/:id
fertilizerRouter.delete(
  '/fertilizer-plans/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { error } = await req.supabase!
        .from('fertilizer_plans')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        throw new Error(`Failed to delete fertilizer plan: ${error.message}`);
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
