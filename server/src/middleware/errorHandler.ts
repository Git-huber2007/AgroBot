import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  const requestId = req.requestId ?? req.headers['x-request-id']?.toString() ?? 'req-' + Date.now();

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, `Server error: ${err.message}`);
    } else {
      logger.warn({ err, requestId }, `Client request rejected [${err.code}]: ${err.message}`);
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  // Handle SyntaxError from malformed JSON payload
  if ('type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload in request body',
        requestId,
      },
    });
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: `Upload error: ${err.message}`,
        requestId,
      },
    });
    return;
  }

  // Unhandled / Internal Server Error
  logger.error({ err, requestId }, `Unhandled internal exception: ${err.message}`);

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message,
      requestId,
    },
  });
};
