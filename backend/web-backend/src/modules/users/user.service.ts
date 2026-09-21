import { Types } from 'mongoose';
import { User, IUser } from './user.model.js';
import { Image } from '../images/image.model.js';
import { Job } from '../jobs/job.model.js';
import { Project } from '../projects/project.model.js';
import { deleteStorageObject } from '../../config/storage.js';

export async function getProfile(userId: string): Promise<Partial<IUser>> {
  const user = await User.findById(userId).select('-passwordHash -refreshTokenHash');
  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return user;
}

export async function updateProfile(
  userId: string,
  data: { name?: string; institution?: string }
): Promise<Partial<IUser>> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true, runValidators: true }
  ).select('-passwordHash -refreshTokenHash');

  if (!user) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }
  return user;
}

export async function deleteAccount(userId: string): Promise<void> {
  const userObjectId = new Types.ObjectId(userId);

  // 1. Clean up user's images from storage bucket and database
  const userImages = await Image.find({ userId: userObjectId });
  for (const img of userImages) {
    if (img.storageKey) {
      await deleteStorageObject(img.storageKey);
    }
  }
  await Image.deleteMany({ userId: userObjectId });

  // 2. Clean up user's jobs and artifacts from storage bucket and database
  const userJobs = await Job.find({ userId: userObjectId });
  for (const job of userJobs) {
    if (job.artifacts) {
      if (job.artifacts.registeredImageStorageKey) {
        await deleteStorageObject(job.artifacts.registeredImageStorageKey);
      }
      if (job.artifacts.matchPointsStorageKey) {
        await deleteStorageObject(job.artifacts.matchPointsStorageKey);
      }
      if (job.artifacts.metricsReportStorageKey) {
        await deleteStorageObject(job.artifacts.metricsReportStorageKey);
      }
      if (job.artifacts.previewOverlayStorageKey) {
        await deleteStorageObject(job.artifacts.previewOverlayStorageKey);
      }
    }
  }
  await Job.deleteMany({ userId: userObjectId });

  // 3. Clean up user's projects
  await Project.deleteMany({ userId: userObjectId });

  // 4. Finally, remove user record
  await User.findByIdAndDelete(userId);
}

