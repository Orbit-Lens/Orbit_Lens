import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';
import { verifyRefreshToken } from '../../utils/jwt.js';

const REFRESH_COOKIE_NAME = 'orbitlens_refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 201);
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions);
    return sendSuccess(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 200);
  } catch (error) {
    next(error);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
      });
    }

    const tokens = await authService.refresh(token);
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, cookieOptions);
    return sendSuccess(res, { accessToken: tokens.accessToken }, 200);
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    let userId = req.user?.userId;

    if (!userId) {
      const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      if (token) {
        try {
          const decoded = verifyRefreshToken(token);
          userId = decoded?.userId;
        } catch {
          // Token expired or invalid; still proceed to clear cookie
        }
      }
    }

    if (userId) {
      await authService.logout(userId);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
    return sendSuccess(res, { message: 'Logged out successfully' }, 200);
  } catch (error) {
    next(error);
  }
}
