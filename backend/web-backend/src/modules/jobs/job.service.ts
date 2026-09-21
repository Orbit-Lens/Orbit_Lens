import { Types } from 'mongoose';
import { Job, IJob, JobStatus } from './job.model.js';
import { Image } from '../images/image.model.js';
import { Project } from '../projects/project.model.js';
import { CreateJobInput, UpdateJobStatusInternalInput } from './job.schema.js';
import { assertOwnership } from '../../utils/ownershipCheck.js';
import { registrationQueue } from '../../config/queue.js';
import { dispatchProcessingJob } from '../../services/processingClient.service.js';
import { generatePresignedDownloadUrl, deleteStorageObject } from '../../config/storage.js';
import { emitJobUpdate } from '../../sockets/index.js';
import { sendJobCompletionEmail } from '../../services/email.service.js';
import { User } from '../users/user.model.js';
import { logger } from '../../utils/logger.js';

export async function createJob(userId: string, input: CreateJobInput): Promise<IJob> {
  if (input.sourceImageId === input.referenceImageId) {
    const err: any = new Error('Source image and reference image must be different');
    err.statusCode = 400;
    err.code = 'INVALID_SENSOR_PAIR';
    throw err;
  }

  // 1. Verify ownership of both images
  const sourceImage = await assertOwnership(Image, input.sourceImageId, userId);
  const referenceImage = await assertOwnership(Image, input.referenceImageId, userId);

  // 2. Verify images are in ready or uploaded state
  if (sourceImage.status !== 'ready' && sourceImage.status !== 'uploaded') {
    const err: any = new Error(`Source image (${sourceImage.name}) has not finished uploading or processing`);
    err.statusCode = 400;
    err.code = 'IMAGE_NOT_READY';
    throw err;
  }
  if (referenceImage.status !== 'ready' && referenceImage.status !== 'uploaded') {
    const err: any = new Error(`Reference image (${referenceImage.name}) has not finished uploading or processing`);
    err.statusCode = 400;
    err.code = 'IMAGE_NOT_READY';
    throw err;
  }

  // 3. Verify project ownership if project is specified
  if (input.projectId) {
    await assertOwnership(Project, input.projectId, userId);
  }

  const job = await Job.create({
    userId: new Types.ObjectId(userId),
    projectId: input.projectId ? new Types.ObjectId(input.projectId) : undefined,
    sourceImageId: sourceImage._id,
    referenceImageId: referenceImage._id,
    algorithm: input.algorithm,
    transformModel: input.transformModel,
    parameters: {
      coverageTargetCells: input.parameters?.coverageTargetCells ?? 64,
      ratioThreshold: input.parameters?.ratioThreshold ?? 0.75,
      ransacReprojThreshold: input.parameters?.ransacReprojThreshold ?? 3.0,
      maxPyramidLevels: input.parameters?.maxPyramidLevels ?? 4,
      illuminationCorrection: input.parameters?.illuminationCorrection ?? true,
    },
    status: 'queued',
    progress: 0,
    statusMessage: 'Job queued for processing',
  });

  const jobPayload = {
    jobId: job._id.toString(),
    sourceImageStorageKey: sourceImage.storageKey,
    referenceImageStorageKey: referenceImage.storageKey,
    sourceSensor: sourceImage.sensor,
    referenceSensor: referenceImage.sensor,
    sourceResolution: sourceImage.resolutionMetersPerPixel,
    referenceResolution: referenceImage.resolutionMetersPerPixel,
    algorithm: job.algorithm,
    transformModel: job.transformModel,
    parameters: job.parameters,
  };

  // 1. Add to BullMQ queue if active
  if (registrationQueue) {
    try {
      await registrationQueue.add('register-images', jobPayload, {
        jobId: job._id.toString(),
      });
    } catch (err: any) {
      logger.warn('Failed to enqueue to BullMQ, falling back to direct dispatch:', err.message);
    }
  }

  // 2. Dispatch directly to Python processing service
  dispatchProcessingJob(jobPayload).catch((err) => {
    logger.error(`Direct dispatch failed for job ${job._id}:`, err);
  });

  emitJobUpdate(userId, job._id.toString(), {
    jobId: job._id.toString(),
    status: 'queued',
    progress: 0,
  });

  return job;
}

export async function updateJobStatusInternal(
  jobId: string,
  input: UpdateJobStatusInternalInput
): Promise<IJob | null> {
  const job = await Job.findById(jobId);
  if (!job) return null;

  job.status = input.status;
  if (input.progress !== undefined) job.progress = input.progress;
  if (input.statusMessage) job.statusMessage = input.statusMessage;
  if (input.metrics) job.metrics = input.metrics as any;
  if (input.artifacts) job.artifacts = input.artifacts;
  if (input.errorMessage) job.errorMessage = input.errorMessage;
  if (input.errorCode) job.errorCode = input.errorCode;

  await job.save();

  emitJobUpdate(job.userId.toString(), job._id.toString(), {
    jobId: job._id.toString(),
    status: job.status,
    progress: job.progress,
    statusMessage: job.statusMessage,
    metrics: job.metrics,
    artifacts: job.artifacts,
    error: job.errorMessage ? { code: job.errorCode, message: job.errorMessage } : null,
  });

  if (job.status === 'complete' && job.metrics) {
    User.findById(job.userId).then((user) => {
      if (user && user.email) {
        sendJobCompletionEmail(user.email, job._id.toString(), job.metrics!.rmse, job.metrics!.inlierCount);
      }
    });
  }

  return job;
}

export async function getJobs(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    status?: JobStatus;
    projectId?: string;
  }
): Promise<{ jobs: IJob[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const query: any = { userId: new Types.ObjectId(userId) };
  if (options.status) query.status = options.status;
  if (options.projectId && Types.ObjectId.isValid(options.projectId)) {
    query.projectId = new Types.ObjectId(options.projectId);
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('sourceImageId', 'name sensor resolutionMetersPerPixel format storageKey')
      .populate('referenceImageId', 'name sensor resolutionMetersPerPixel format storageKey')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  return { jobs, total };
}

export async function getJobById(userId: string, jobId: string): Promise<IJob> {
  const job = await assertOwnership(Job, jobId, userId);
  await job.populate('sourceImageId', 'name filename sensor resolutionMetersPerPixel sunAzimuthDeg sunElevationDeg storageKey');
  await job.populate('referenceImageId', 'name filename sensor resolutionMetersPerPixel sunAzimuthDeg sunElevationDeg storageKey');
  return job;
}

export async function getJobArtifacts(
  userId: string,
  jobId: string
): Promise<{
  registeredImageUrl?: string;
  matchPointsUrl?: string;
  metricsReportUrl?: string;
  previewOverlayUrl?: string;
}> {
  const job = await assertOwnership(Job, jobId, userId);

  const result: any = {};
  if (job.artifacts?.registeredImageStorageKey) {
    result.registeredImageUrl = await generatePresignedDownloadUrl(job.artifacts.registeredImageStorageKey);
  }
  if (job.artifacts?.matchPointsStorageKey) {
    result.matchPointsUrl = await generatePresignedDownloadUrl(job.artifacts.matchPointsStorageKey);
  }
  if (job.artifacts?.metricsReportStorageKey) {
    result.metricsReportUrl = await generatePresignedDownloadUrl(job.artifacts.metricsReportStorageKey);
  }
  if (job.artifacts?.previewOverlayStorageKey) {
    result.previewOverlayUrl = await generatePresignedDownloadUrl(job.artifacts.previewOverlayStorageKey);
  }

  return result;
}

export async function deleteJob(userId: string, jobId: string): Promise<void> {
  const job = await assertOwnership(Job, jobId, userId);

  // Clean up artifact files from storage bucket
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

  await Job.findByIdAndDelete(jobId);
}
