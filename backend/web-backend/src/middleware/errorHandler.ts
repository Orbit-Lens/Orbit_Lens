import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`Unhandled error on ${req.method} ${req.url}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode,
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'An error occurred';

  return sendError(res, code, message, statusCode, err.fields);
}
