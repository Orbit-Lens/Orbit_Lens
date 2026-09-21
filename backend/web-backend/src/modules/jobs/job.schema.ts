import { z } from 'zod';

export const createJobSchema = z.object({
  sourceImageId: z.string().min(1, 'Source image ID is required'),
  referenceImageId: z.string().min(1, 'Reference image ID is required'),
  projectId: z.string().optional(),
  algorithm: z.enum(['classical', 'learned']).default('classical'),
  transformModel: z.enum(['affine', 'homography']).default('homography'),
  parameters: z
    .object({
      coverageTargetCells: z.number().int().min(4).max(256).default(64),
      ratioThreshold: z.number().min(0.1).max(0.95).default(0.75),
      ransacReprojThreshold: z.number().min(0.5).max(20.0).default(3.0),
      maxPyramidLevels: z.number().int().min(1).max(6).default(4),
      illuminationCorrection: z.boolean().default(true),
    })
    .optional(),
});

export const updateJobStatusInternalSchema = z.object({
  status: z.enum([
    'queued',
    'preprocessing',
    'matching',
    'estimating_transform',
    'warping',
    'scoring',
    'complete',
    'failed',
  ]),
  progress: z.number().min(0).max(100).optional(),
  statusMessage: z.string().optional(),
  metrics: z
    .object({
      rmse: z.number(),
      inlierCount: z.number(),
      totalCandidateMatches: z.number(),
      inlierRatio: z.number(),
      meanReprojectionError: z.number(),
      medianReprojectionError: z.number(),
      coverageUniformityScore: z.number(),
      processingTimeMs: z.number(),
      sunAngleDeltaAzimuth: z.number().optional(),
      sunAngleDeltaElevation: z.number().optional(),
      confidenceWarning: z.boolean().optional(),
    })
    .optional(),
  artifacts: z
    .object({
      registeredImageStorageKey: z.string().optional(),
      matchPointsStorageKey: z.string().optional(),
      metricsReportStorageKey: z.string().optional(),
      previewOverlayStorageKey: z.string().optional(),
    })
    .optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobStatusInternalInput = z.infer<typeof updateJobStatusInternalSchema>;
