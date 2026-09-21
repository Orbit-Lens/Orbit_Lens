import { Request, Response, NextFunction } from 'express';
import { Job } from '../jobs/job.model.js';
import { sendSuccess } from '../../utils/response.js';
import { Types } from 'mongoose';

export async function getMetricsOverviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = new Types.ObjectId(req.user!.userId);

    const [summary] = await Job.aggregate([
      { $match: { userId, status: 'complete', 'metrics.rmse': { $exists: true } } },
      {
        $group: {
          _id: null,
          totalCompletedJobs: { $sum: 1 },
          avgRmse: { $avg: '$metrics.rmse' },
          avgInlierRatio: { $avg: '$metrics.inlierRatio' },
          avgInlierCount: { $avg: '$metrics.inlierCount' },
          avgCoverageUniformity: { $avg: '$metrics.coverageUniformityScore' },
          avgProcessingTimeMs: { $avg: '$metrics.processingTimeMs' },
          subPixelAccuracyCount: {
            $sum: { $cond: [{ $lte: ['$metrics.rmse', 1.0] }, 1, 0] },
          },
        },
      },
    ]);

    const recentJobs = await Job.find({ userId, status: 'complete' })
      .select('algorithm transformModel metrics createdAt sourceImageId referenceImageId')
      .populate('sourceImageId', 'name sensor')
      .populate('referenceImageId', 'name sensor')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(res, {
      overview: summary || {
        totalCompletedJobs: 0,
        avgRmse: 0,
        avgInlierRatio: 0,
        avgInlierCount: 0,
        avgCoverageUniformity: 0,
        avgProcessingTimeMs: 0,
        subPixelAccuracyCount: 0,
      },
      recentRegistrations: recentJobs,
    });
  } catch (error) {
    next(error);
  }
}
