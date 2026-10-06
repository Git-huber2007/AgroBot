import { Router } from 'express';
import { FeedbackSchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';

export const feedbackRouter = Router();

// POST /feedback
feedbackRouter.post(
  '/feedback',
  requireAuth,
  validate({ body: FeedbackSchema }),
  async (req, res, next) => {
    try {
      const { record_type, record_id, is_helpful, comment } = req.body;
      const userId = req.user!.id;

      const tableMap: Record<string, string> = {
        crop_advisory: 'crop_advisories',
        crop_recommendation: 'crop_recommendations',
        pest_diagnosis: 'pest_diagnoses',
        fertilizer_plan: 'fertilizer_plans',
      };

      const tableName = tableMap[record_type];
      if (!tableName) {
        throw new NotFoundError('Invalid record type');
      }

      const { data: record, error: checkErr } = await req.supabase!
        .from(tableName)
        .select('id')
        .eq('id', record_id)
        .maybeSingle();

      if (checkErr || !record) {
        throw new NotFoundError('Record not found or you do not have permission to review it.');
      }

      const { data: feedbackRow, error: saveErr } = await req.supabase!
        .from('feedback')
        .upsert(
          {
            user_id: userId,
            record_type,
            record_id,
            is_helpful,
            comment: comment || null,
          },
          {
            onConflict: 'user_id,record_type,record_id',
          },
        )
        .select('*')
        .single();

      if (saveErr) {
        throw new Error(`Failed to record feedback: ${saveErr.message}`);
      }

      res.status(201).json({ data: feedbackRow });
    } catch (err) {
      next(err);
    }
  },
);
