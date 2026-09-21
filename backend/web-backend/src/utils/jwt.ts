import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthUserPayload } from '../types/express.d.js';

export function signAccessToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): AuthUserPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUserPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
}
