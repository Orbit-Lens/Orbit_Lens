import { Types } from 'mongoose';
import { Image, IImage, SensorType } from './image.model.js';
import { Project } from '../projects/project.model.js';
import { User } from '../users/user.model.js';
import { Job } from '../jobs/job.model.js';
import { RequestUploadUrlInput, ConfirmUploadInput, UpdateImageInput } from './image.schema.js';
import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  checkObjectExists,
  deleteStorageObject,
} from '../../config/storage.js';
import { assertOwnership } from '../../utils/ownershipCheck.js';
import { triggerMetadataExtraction } from '../../services/processingClient.service.js';
import { logger } from '../../utils/logger.js';

export async function requestUpload(
  userId: string,
  input: RequestUploadUrlInput
): Promise<{ image: IImage; uploadUrl: string }> {
  // 1. Verify project ownership if project is specified
  if (input.projectId) {
    await assertOwnership(Project, input.projectId, userId);
  }

  // 2. Storage quota validation for user
  const user = await User.findById(userId);
  if (user && user.storageUsedBytes >= user.storageQuotaBytes) {
    const err: any = new Error('Storage quota exceeded. Please remove existing imagery or upgrade storage.');
    err.statusCode = 403;
    err.code = 'QUOTA_EXCEEDED';
    throw err;
  }

  const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `imagery/${userId}/${Date.now()}_${sanitizedFilename}`;

  const image = await Image.create({
    userId: new Types.ObjectId(userId),
    projectId: input.projectId ? new Types.ObjectId(input.projectId) : undefined,
    name: input.name,
    filename: input.filename,
    format: input.format,
    sensor: input.sensor,
    resolutionMetersPerPixel: input.resolutionMetersPerPixel,
    sunAzimuthDeg: input.sunAzimuthDeg,
    sunElevationDeg: input.sunElevationDeg,
    acquisitionTime: input.acquisitionTime ? new Date(input.acquisitionTime) : undefined,
    storageKey,
    status: 'pending_upload',
  });

  const uploadUrl = await generatePresignedUploadUrl(storageKey, input.contentType);

  return { image, uploadUrl };
}

export async function confirmUpload(
  userId: string,
  imageId: string,
  input?: ConfirmUploadInput
): Promise<IImage> {
  const image = await assertOwnership(Image, imageId, userId);

  // Verify object existence in the storage bucket
  const objectMeta = await checkObjectExists(image.storageKey);
  if (!objectMeta.exists && !input?.fileSizeBytes) {
    const err: any = new Error('File not detected in storage bucket. Please complete binary upload before confirming.');
    err.statusCode = 400;
    err.code = 'FILE_NOT_FOUND';
    throw err;
  }

  image.status = 'ready';
  const resolvedSize = objectMeta.sizeBytes || input?.fileSizeBytes;
  if (resolvedSize) {
    image.fileSizeBytes = resolvedSize;
    // Update user storage usage
    await User.findByIdAndUpdate(userId, { $inc: { storageUsedBytes: resolvedSize } });
  }

  if (input) {
    if (input.width) image.width = input.width;
    if (input.height) image.height = input.height;
    if (input.channels) image.channels = input.channels;
    if (input.resolutionMetersPerPixel) image.resolutionMetersPerPixel = input.resolutionMetersPerPixel;
    if (input.sunAzimuthDeg !== undefined) image.sunAzimuthDeg = input.sunAzimuthDeg;
    if (input.sunElevationDeg !== undefined) image.sunElevationDeg = input.sunElevationDeg;
  }

  await image.save();

  // Asynchronously request Python processing service to inspect/parse raster metadata
  triggerMetadataExtraction(image._id.toString(), image.storageKey)
    .then(async (metadata) => {
      if (metadata) {
        if (metadata.width) image.width = metadata.width;
        if (metadata.height) image.height = metadata.height;
        if (metadata.channels) image.channels = metadata.channels;
        if (metadata.resolutionMetersPerPixel) image.resolutionMetersPerPixel = metadata.resolutionMetersPerPixel;
        if (metadata.sunAzimuthDeg !== undefined) image.sunAzimuthDeg = metadata.sunAzimuthDeg;
        if (metadata.sunElevationDeg !== undefined) image.sunElevationDeg = metadata.sunElevationDeg;
        if (metadata.footprint) image.footprint = metadata.footprint;
        image.metadataParsed = true;
        await image.save();
      }
    })
    .catch((err) => {
      logger.warn(`Metadata extraction notice for image ${imageId}:`, err.message);
    });

  return image;
}

export async function getImages(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    sensor?: SensorType;
    projectId?: string;
    status?: string;
  }
): Promise<{ images: IImage[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = { userId: new Types.ObjectId(userId) };
  if (options.sensor) query.sensor = options.sensor;
  if (options.projectId && Types.ObjectId.isValid(options.projectId)) {
    query.projectId = new Types.ObjectId(options.projectId);
  }
  if (options.status) query.status = options.status;

  const [images, total] = await Promise.all([
    Image.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Image.countDocuments(query),
  ]);

  return { images, total };
}

export async function getImageById(userId: string, imageId: string): Promise<IImage> {
  return await assertOwnership(Image, imageId, userId);
}

export async function getImageDownloadUrl(userId: string, imageId: string): Promise<string> {
  const image = await assertOwnership(Image, imageId, userId);
  return await generatePresignedDownloadUrl(image.storageKey);
}

export async function updateImage(
  userId: string,
  imageId: string,
  input: UpdateImageInput
): Promise<IImage> {
  const image = await assertOwnership(Image, imageId, userId);
  if (input.name) image.name = input.name;
  if (input.sensor) image.sensor = input.sensor;
  if (input.resolutionMetersPerPixel !== undefined) image.resolutionMetersPerPixel = input.resolutionMetersPerPixel;
  if (input.sunAzimuthDeg !== undefined) image.sunAzimuthDeg = input.sunAzimuthDeg;
  if (input.sunElevationDeg !== undefined) image.sunElevationDeg = input.sunElevationDeg;
  if (input.projectId) {
    await assertOwnership(Project, input.projectId, userId);
    image.projectId = new Types.ObjectId(input.projectId);
  }

  return await image.save();
}

export async function deleteImage(userId: string, imageId: string): Promise<void> {
  const image = await assertOwnership(Image, imageId, userId);

  // Prevent deletion if image is involved in an active or queued registration job
  const activeJob = await Job.findOne({
    $or: [{ sourceImageId: image._id }, { referenceImageId: image._id }],
    status: { $in: ['queued', 'preprocessing', 'matching', 'estimating_transform', 'warping', 'scoring'] },
  });
  if (activeJob) {
    const err: any = new Error('Cannot delete image while it is being used in an active processing job');
    err.statusCode = 400;
    err.code = 'IMAGE_IN_USE';
    throw err;
  }

  // Delete binary object from storage bucket
  if (image.storageKey) {
    await deleteStorageObject(image.storageKey);
  }

  // Adjust user storage quota usage
  if (image.fileSizeBytes) {
    await User.findByIdAndUpdate(userId, { $inc: { storageUsedBytes: -image.fileSizeBytes } });
  }

  await Image.findByIdAndDelete(imageId);
}
