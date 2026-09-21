import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validate(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.') || 'root';
          if (!fields[path]) {
            fields[path] = [];
          }
          fields[path].push(issue.message);
        }

        return sendError(
          res,
          'VALIDATION_ERROR',
          'Validation failed for incoming request parameters',
          400,
          fields
        );
      }
      next(error);
    }
  };
}
