import { Request } from 'express';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'researcher';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
