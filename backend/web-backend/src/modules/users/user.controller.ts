import { Request, Response, NextFunction } from 'express';
import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/response.js';
import { Image } from '../images/image.model.js';
import { Job } from '../jobs/job.model.js';

export async function getProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.getProfile(req.user!.userId);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
}

export async function exportDataHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await userService.getProfile(userId);
    const images = await Image.find({ userId }).select('-__v');
    const jobs = await Job.find({ userId }).select('-__v');

    return sendSuccess(res, {
      profile: user,
      images,
      jobs,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAccountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await userService.deleteAccount(req.user!.userId);
    res.clearCookie('orbitlens_refresh_token', { path: '/api/v1/auth' });
    return sendSuccess(res, { message: 'Account successfully deleted' });
  } catch (error) {
    next(error);
  }
}
