import mongoose, { Schema, Document, Types } from 'mongoose';

export type JobStatus =
  | 'queued'
  | 'preprocessing'
  | 'matching'
  | 'estimating_transform'
  | 'warping'
  | 'scoring'
  | 'complete'
  | 'failed';

export type MatcherAlgorithm = 'classical' | 'learned';
export type TransformModel = 'affine' | 'homography';

export interface IJobMetrics {
  rmse: number;
  inlierCount: number;
  totalCandidateMatches: number;
  inlierRatio: number;
  meanReprojectionError: number;
  medianReprojectionError: number;
  coverageUniformityScore: number;
  processingTimeMs: number;
  sunAngleDeltaAzimuth?: number;
  sunAngleDeltaElevation?: number;
  confidenceWarning?: boolean;
}

export interface IJobArtifacts {
  registeredImageStorageKey?: string;
  matchPointsStorageKey?: string;
  metricsReportStorageKey?: string;
  previewOverlayStorageKey?: string;
}

export interface IJobParameters {
  coverageTargetCells: number;
  ratioThreshold: number;
  ransacReprojThreshold: number;
  maxPyramidLevels: number;
  illuminationCorrection: boolean;
}

export interface IJob extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  sourceImageId: Types.ObjectId;
  referenceImageId: Types.ObjectId;
  algorithm: MatcherAlgorithm;
  transformModel: TransformModel;
  parameters: IJobParameters;
  status: JobStatus;
  progress: number;
  statusMessage?: string;
  metrics?: IJobMetrics;
  artifacts?: IJobArtifacts;
  errorMessage?: string;
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    sourceImageId: { type: Schema.Types.ObjectId, ref: 'Image', required: true, index: true },
    referenceImageId: { type: Schema.Types.ObjectId, ref: 'Image', required: true, index: true },
    algorithm: {
      type: String,
      enum: ['classical', 'learned'],
      default: 'classical',
    },
    transformModel: {
      type: String,
      enum: ['affine', 'homography'],
      default: 'homography',
    },
    parameters: {
      coverageTargetCells: { type: Number, default: 64 },
      ratioThreshold: { type: Number, default: 0.75 },
      ransacReprojThreshold: { type: Number, default: 3.0 },
      maxPyramidLevels: { type: Number, default: 4 },
      illuminationCorrection: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: [
        'queued',
        'preprocessing',
        'matching',
        'estimating_transform',
        'warping',
        'scoring',
        'complete',
        'failed',
      ],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    statusMessage: { type: String },
    metrics: {
      rmse: Number,
      inlierCount: Number,
      totalCandidateMatches: Number,
      inlierRatio: Number,
      meanReprojectionError: Number,
      medianReprojectionError: Number,
      coverageUniformityScore: Number,
      processingTimeMs: Number,
      sunAngleDeltaAzimuth: Number,
      sunAngleDeltaElevation: Number,
      confidenceWarning: Boolean,
    },
    artifacts: {
      registeredImageStorageKey: String,
      matchPointsStorageKey: String,
      metricsReportStorageKey: String,
      previewOverlayStorageKey: String,
    },
    errorMessage: String,
    errorCode: String,
  },
  { timestamps: true }
);

JobSchema.index({ userId: 1, createdAt: -1 });
JobSchema.index({ userId: 1, status: 1 });
JobSchema.index({ userId: 1, projectId: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);
