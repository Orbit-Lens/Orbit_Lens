import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export function roleGuard(allowedRoles: Array<'user' | 'admin' | 'researcher'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'FORBIDDEN', 'Insufficient permissions for this operation', 403);
    }

    next();
  };
}
