import { Router } from 'express';
import { IdParamSchema, RecommendationRequestSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { aiHourlyLimiter } from '../middleware/rateLimiters.js';
import { checkAiDailyQuota } from '../middleware/aiQuota.js';
import { RecommendationService } from '../services/recommendation.service.js';
import { NotFoundError } from '../utils/errors.js';

export const recommendationsRouter = Router();

// POST /recommendations
recommendationsRouter.post(
  '/recommendations',
  requireAuth,
  aiHourlyLimiter,
  checkAiDailyQuota,
  validate({ body: RecommendationRequestSchema }),
  async (req, res, next) => {
    try {
      const result = await RecommendationService.generateRecommendations(
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

// GET /recommendations/:id
recommendationsRouter.get(
  '/recommendations/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { data: rec, error } = await req.supabase!
        .from('crop_recommendations')
        .select('*, farms(name, district, state, area_hectares)')
        .eq('id', req.params.id)
        .maybeSingle();

      if (error || !rec) {
        throw new NotFoundError('Crop recommendation not found.');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const farmObj = (Array.isArray(rec.farms) ? rec.farms[0] : rec.farms) as any;

      res.json({
        data: {
          ...rec,
          farm: farmObj,
          farm_name: farmObj?.name,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /recommendations/:id
recommendationsRouter.delete(
  '/recommendations/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { error } = await req.supabase!
        .from('crop_recommendations')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        throw new Error(`Failed to delete recommendation: ${error.message}`);
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
