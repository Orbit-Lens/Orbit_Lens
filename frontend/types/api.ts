export type UserRole = "user" | "researcher" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  createdAt: string;
}

export type SensorType = "OHRC" | "TMC-2" | "IIRS" | "LRO_NAC" | "LRO_WAC" | "KAGUYA" | "OTHER";
export type ImageFormat = "GEOTIFF" | "PDS4_IMG" | "PNG" | "JPEG" | "TIFF";
export type ImageStatus = "pending_upload" | "uploaded" | "ready" | "failed";

// UI calls this 'Dataset', backend model is 'Image'
export interface Dataset {
  id: string;
  name: string;
  filename: string;
  format: ImageFormat;
  sensor: SensorType;
  resolutionMetersPerPixel?: number;
  sunAzimuthDeg?: number;
  sunElevationDeg?: number;
  incidenceAngleDeg?: number;
  emissionAngleDeg?: number;
  phaseAngleDeg?: number;
  acquisitionTime?: string;
  storageKey: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  channels?: number;
  footprint?: {
    type: string;
    coordinates: number[][][];
  };
  status: ImageStatus;
  errorMessage?: string;
  metadataParsed: boolean;
  createdAt: string;
}

export type JobStatus =
  | "queued"
  | "preprocessing"
  | "matching"
  | "estimating_transform"
  | "warping"
  | "scoring"
  | "complete"
  | "failed";

export type MatcherAlgorithm = "classical" | "learned";
export type TransformModel = "affine" | "homography";

export interface JobMetrics {
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

export interface JobArtifacts {
  registeredImageStorageKey?: string;
  matchPointsStorageKey?: string;
  metricsReportStorageKey?: string;
  previewOverlayStorageKey?: string;
}

export interface JobParameters {
  coverageTargetCells: number;
  ratioThreshold: number;
  ransacReprojThreshold: number;
  maxPyramidLevels: number;
  illuminationCorrection: boolean;
}

// UI calls this 'AnalysisRun' or 'RegistrationResult', backend model is 'Job'
export interface AnalysisJob {
  id: string;
  userId: string;
  projectId?: string;
  sourceImageId: Dataset | string;
  referenceImageId: Dataset | string;
  algorithm: MatcherAlgorithm;
  transformModel: TransformModel;
  parameters: JobParameters;
  status: JobStatus;
  progress: number;
  statusMessage?: string;
  metrics?: JobMetrics;
  artifacts?: JobArtifacts;
  errorMessage?: string;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricsOverview {
  totalCompletedJobs: number;
  avgRmse: number;
  avgInlierRatio: number;
  avgInlierCount: number;
  avgCoverageUniformity: number;
  avgProcessingTimeMs: number;
  subPixelAccuracyCount: number;
}

export interface TiePoint {
  id: number;
  sourceX: number;
  sourceY: number;
  referenceX: number;
  referenceY: number;
  reprojectionResidual: number;
  status?: "inlier" | "rejected";
}

export function formatJobStatus(status: JobStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "preprocessing":
      return "Preprocessing";
    case "matching":
      return "Feature Matching";
    case "estimating_transform":
      return "Estimating Homography";
    case "warping":
      return "Sub-Pixel Warping";
    case "scoring":
      return "Computing Metrics";
    case "complete":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function getJobStatusBadgeVariant(
  status: JobStatus
): "queued" | "processing" | "success" | "error" {
  switch (status) {
    case "queued":
      return "queued";
    case "complete":
      return "success";
    case "failed":
      return "error";
    default:
      return "processing";
  }
}
