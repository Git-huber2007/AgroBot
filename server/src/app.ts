import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import pinoHttpImport from 'pino-http';
import crypto from 'node:crypto';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalRateLimiter } from './middleware/rateLimiters.js';
import { apiRouter } from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Resolve CJS / ESM interop for pino-http
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoHttp = (pinoHttpImport as any).default || pinoHttpImport;

export function createApp() {
  const app = express();

  // 1. Disable x-powered-by header
  app.disable('x-powered-by');

  // 2. Request ID & Pino HTTP logging middleware
  app.use(
    pinoHttp({
      logger,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      genReqId: (req: any) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      customAttributeKeys: {
        reqId: 'requestId',
      },
      serializers: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: (req: any) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
        }),
      },
    }),
  );

  // Set request ID on req
  app.use((req, _res, next) => {
    req.requestId = (req.id as string) || (req.headers['x-request-id'] as string) || crypto.randomUUID();
    next();
  });

  // 3. Helmet HTTP security headers with strict API CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 4. CORS configuration (§18.7)
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        const isAllowed =
          env.CORS_ORIGINS.includes('*') ||
          env.CORS_ORIGINS.includes(origin) ||
          env.CORS_ORIGINS.some(allowed =>
            allowed.includes('*')
              ? new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$').test(origin)
              : false,
          ) ||
          env.NODE_ENV === 'development';

        if (isAllowed) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      maxAge: 86400,
    }),
  );

  // 5. Body parser with strict 100kb limit (§18.4)
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 6. HTTP Parameter Pollution protection
  app.use(hpp());

  // 7. Global Rate Limiter
  app.use(globalRateLimiter);

  // 8. API Routes
  app.use('/api/v1', apiRouter);

  // 9. 404 Handler
  app.use(notFoundHandler);

  // 10. Central Error Handler
  app.use(errorHandler);

  return app;
}
