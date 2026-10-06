import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { LIMITS } from '../config/limits.js';

function createCustomLimiter(windowMs: number, max: number, code: string, message: string, keyExtractor?: (req: Request) => string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      if (keyExtractor) return keyExtractor(req);
      return req.user?.id || req.ip || 'anonymous';
    },
    handler: (req: Request, res: Response, _next, options) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: {
          code,
          message,
          retryAfterSeconds: retryAfter,
          requestId: req.requestId,
        },
      });
    },
  });
}

export const globalRateLimiter = createCustomLimiter(
  LIMITS.GLOBAL_WINDOW_MS,
  LIMITS.GLOBAL_MAX_REQUESTS,
  'RATE_LIMIT_EXCEEDED',
  'Too many requests from this IP. Please slow down.',
  (req: Request) => req.ip || 'ip',
);

export const authSensitiveLimiter = createCustomLimiter(
  LIMITS.AUTH_SENSITIVE_WINDOW_MS,
  LIMITS.AUTH_SENSITIVE_MAX,
  'AUTH_RATE_LIMIT_EXCEEDED',
  'Too many sensitive account operations. Please wait before retrying.',
);

export const aiHourlyLimiter = createCustomLimiter(
  LIMITS.AI_HOURLY_WINDOW_MS,
  LIMITS.AI_HOURLY_MAX_REQUESTS,
  'AI_RATE_LIMIT_EXCEEDED',
  'Hourly AI generation limit exceeded (20 requests per hour). Please wait before requesting another advisory.',
);
