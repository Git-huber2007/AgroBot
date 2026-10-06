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
        .select('*, crops(name_en, name_hi), farms(name, district, state, area_hectares)')
        .eq('id', req.params.id)
        .maybeSingle();

      if (error || !plan) {
        throw new NotFoundError('Fertilizer plan not found.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const farmObj = (Array.isArray(plan.farms) ? plan.farms[0] : plan.farms) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cropObj = (Array.isArray(plan.crops) ? plan.crops[0] : plan.crops) as any;

      res.json({
        data: {
          ...plan,
          farm: farmObj,
          crop: cropObj,
          farm_name: farmObj?.name,
          crop_name: cropObj?.name_en,
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
