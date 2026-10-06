import { Router } from 'express';
import { LIMITS } from '../config/limits.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const usageRouter = Router();

// GET /usage/today
usageRouter.get('/usage/today', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const { count, error } = await req.supabase!
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfToday.toISOString());

    if (error) {
      throw new Error(`Failed to calculate today's quota usage: ${error.message}`);
    }

    const used = count ?? 0;

    res.json({
      data: {
        used,
        limit: LIMITS.AI_DAILY_QUOTA,
        remaining: Math.max(0, LIMITS.AI_DAILY_QUOTA - used),
        resetsAt: new Date(
          Date.UTC(
            startOfToday.getUTCFullYear(),
            startOfToday.getUTCMonth(),
            startOfToday.getUTCDate() + 1,
            0,
            0,
            0,
          ),
        ).toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});
