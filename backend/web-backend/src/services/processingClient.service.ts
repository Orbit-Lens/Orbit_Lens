import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const client = axios.create({
  baseURL: env.PROCESSING_SERVICE_URL,
  headers: {
    'X-Internal-Key': env.PROCESSING_SERVICE_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout for large tasks
});

export interface DispatchJobPayload {
  jobId: string;
  sourceImageStorageKey: string;
  referenceImageStorageKey: string;
  sourceSensor: string;
  referenceSensor: string;
  sourceResolution?: number;
  referenceResolution?: number;
  algorithm: 'classical' | 'learned';
  transformModel: 'affine' | 'homography';
  parameters: {
    coverageTargetCells: number;
    ratioThreshold: number;
    ransacReprojThreshold: number;
    maxPyramidLevels: number;
    illuminationCorrection: boolean;
  };
}

export async function dispatchProcessingJob(payload: DispatchJobPayload): Promise<boolean> {
  try {
    const response = await client.post('/internal/jobs', payload);
    return response.status === 200 || response.status === 202;
  } catch (error: any) {
    logger.error('Failed to dispatch job to processing service:', {
      message: error.message,
      url: `${env.PROCESSING_SERVICE_URL}/internal/jobs`,
      status: error.response?.status,
      data: error.response?.data,
    });
    return false;
  }
}

export async function triggerMetadataExtraction(
  imageId: string,
  storageKey: string
): Promise<any> {
  try {
    const response = await client.post('/internal/metadata/extract', {
      imageId,
      storageKey,
    });
    return response.data?.data || null;
  } catch (error: any) {
    logger.warn('Metadata extraction call to processing service failed:', error.message);
    return null;
  }
}

export async function getProcessingServiceHealth(): Promise<{ status: string; details?: any }> {
  try {
    const response = await client.get('/health', { timeout: 3000 });
    return { status: 'healthy', details: response.data };
  } catch (error: any) {
    return { status: 'unreachable', details: error.message };
  }
}
