import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.requestId ?? req.headers['x-request-id']?.toString() ?? 'req-' + Date.now();
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
      requestId,
    },
  });
}
