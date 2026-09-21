import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later.',
      429
    );
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 requests per 15 min for login/register/refresh
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts, please try again in 15 minutes.',
      429
    );
  },
});

export const jobCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 jobs per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Job submission rate limit exceeded. Please wait before creating more registration jobs.',
      429
    );
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 upload URL requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Upload request rate limit exceeded.',
      429
    );
  },
});
