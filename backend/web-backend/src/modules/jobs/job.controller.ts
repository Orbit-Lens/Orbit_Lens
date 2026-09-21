import { Request, Response, NextFunction } from 'express';
import * as jobService from './job.service.js';
import { sendSuccess, sendPaginated, sendError } from '../../utils/response.js';
import { timingSafeEqual } from '../../utils/tokenCompare.js';
import { env } from '../../config/env.js';

export async function createJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobService.createJob(req.user!.userId, req.body);
    return sendSuccess(res, job, 201);
  } catch (error) {
    next(error);
  }
}

export async function getJobsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as any;
    const projectId = req.query.projectId as string;

    const { jobs, total } = await jobService.getJobs(req.user!.userId, {
      page,
      limit,
      status,
      projectId,
    });

    return sendPaginated(
      res,
      jobs,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

export async function getJobByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobService.getJobById(req.user!.userId, req.params.id);
    return sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
}

export async function getJobMetricsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobService.getJobById(req.user!.userId, req.params.id);
    if (!job.metrics) {
      return sendError(res, 'METRICS_NOT_READY', 'Job metrics are not available yet', 404);
    }
    return sendSuccess(res, job.metrics);
  } catch (error) {
    next(error);
  }
}

export async function getJobArtifactsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const artifacts = await jobService.getJobArtifacts(req.user!.userId, req.params.id);
    return sendSuccess(res, artifacts);
  } catch (error) {
    next(error);
  }
}

export async function deleteJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await jobService.deleteJob(req.user!.userId, req.params.id);
    return sendSuccess(res, { message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Internal callback endpoint for Python processing service to report progress/results
 */
export async function updateJobStatusInternalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const internalKey = req.headers['x-internal-key'] as string;
    if (!internalKey || !timingSafeEqual(internalKey, env.PROCESSING_SERVICE_API_KEY)) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid internal service key', 401);
    }

    const job = await jobService.updateJobStatusInternal(req.params.id, req.body);
    if (!job) {
      return sendError(res, 'NOT_FOUND', 'Job not found', 404);
    }

    return sendSuccess(res, { message: 'Job status updated successfully' });
  } catch (error) {
    next(error);
  }
}
