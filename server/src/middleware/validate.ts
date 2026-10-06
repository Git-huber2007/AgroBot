import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../utils/errors.js';

interface ValidateSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidateSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (!result.success) {
          throw new ValidationError('Validation failed for request body', 
            result.error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            }))
          );
        }
        req.body = result.data;
      }

      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query);
        if (!result.success) {
          throw new ValidationError('Validation failed for query parameters', 
            result.error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            }))
          );
        }
        req.query = result.data as Request['query'];
      }

      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params);
        if (!result.success) {
          throw new ValidationError('Validation failed for route parameters', 
            result.error.issues.map(i => ({
              path: i.path.join('.'),
              message: i.message,
            }))
          );
        }
        req.params = result.data as Request['params'];
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
