import { Router } from 'express';
import { HistoryQuerySchema } from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

export const historyRouter = Router();

// GET /history
historyRouter.get(
  '/history',
  requireAuth,
  validate({ query: HistoryQuerySchema }),
  async (req, res, next) => {
    try {
      const { type, farmId, cropId, from, to, page, pageSize } = req.query as unknown as {
        type?: string;
        farmId?: string;
        cropId?: number;
        from?: string;
        to?: string;
        page: number;
        pageSize: number;
      };

      let query = req.supabase!
        .from('history_items')
        .select('*', { count: 'exact' });

      if (type) {
        query = query.eq('record_type', type);
      }
      if (farmId) {
        query = query.eq('farm_id', farmId);
      }
      if (cropId) {
        query = query.eq('crop_id', cropId);
      }
      if (from) {
        query = query.gte('created_at', from);
      }
      if (to) {
        query = query.lte('created_at', `${to}T23:59:59.999Z`);
      }

      const offset = (page - 1) * pageSize;
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const { data: items, count, error } = await query;

      if (error) {
        throw new Error(`Failed to load history items: ${error.message}`);
      }

      const farmIds = Array.from(new Set((items || []).map(i => i.farm_id).filter(Boolean)));
      const cropIds = Array.from(new Set((items || []).map(i => i.crop_id).filter(Boolean)));

      let farmMap: Record<string, string> = {};
      let cropMap: Record<number, string> = {};

      if (farmIds.length > 0) {
        const { data: farms } = await req.supabase!
          .from('farms')
          .select('id, name')
          .in('id', farmIds);
        if (farms) {
          farmMap = Object.fromEntries(farms.map(f => [f.id, f.name]));
        }
      }

      if (cropIds.length > 0) {
        const { data: crops } = await req.supabase!
          .from('crops')
          .select('id, name_en')
          .in('id', cropIds);
        if (crops) {
          cropMap = Object.fromEntries(crops.map(c => [c.id, c.name_en]));
        }
      }

      const recordIds = (items || []).map(i => i.id);
      let feedbackMap: Record<string, { is_helpful: boolean; comment: string | null }> = {};

      if (recordIds.length > 0) {
        const { data: feedbackRows } = await req.supabase!
          .from('feedback')
          .select('record_id, is_helpful, comment')
          .in('record_id', recordIds);

        if (feedbackRows) {
          feedbackMap = Object.fromEntries(
            feedbackRows.map(fb => [fb.record_id, { is_helpful: fb.is_helpful, comment: fb.comment }]),
          );
        }
      }

      const enriched = (items || []).map(item => ({
        ...item,
        farm_name: item.farm_id ? farmMap[item.farm_id] : undefined,
        crop_name: item.crop_id ? cropMap[item.crop_id] : undefined,
        feedback: feedbackMap[item.id],
      }));

      const total = count ?? 0;
      const totalPages = Math.ceil(total / pageSize);

      res.json({
        data: {
          items: enriched,
          total,
          totalPages,
          page,
          pageSize,
        },
        meta: {
          page,
          pageSize,
          total,
          totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
