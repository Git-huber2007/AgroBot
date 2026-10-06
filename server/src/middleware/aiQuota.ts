import type { NextFunction, Request, Response } from 'express';
import { LIMITS } from '../config/limits.js';
import { supabaseAdmin } from '../db/adminClient.js';
import { RateLimitError } from '../utils/errors.js';

export async function checkAiDailyQuota(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next();
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabaseAdmin
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfToday.toISOString());

    if (error) {
      // If logging check encounters DB read issue, allow request to proceed but log warning
      req.log?.warn({ err: error }, 'Failed to verify AI daily quota usage log');
      return next();
    }

    if ((count ?? 0) >= LIMITS.AI_DAILY_QUOTA) {
      throw new RateLimitError(
        `Daily AI quota of ${LIMITS.AI_DAILY_QUOTA} advisories has been reached. Quota resets at 00:00 UTC.`,
        undefined,
        'DAILY_QUOTA_EXCEEDED',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
