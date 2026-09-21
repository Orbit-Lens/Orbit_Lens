import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const isPlaceholderKey =
  !env.S3_ACCESS_KEY_ID ||
  env.S3_ACCESS_KEY_ID === 'your_access_key' ||
  env.S3_ACCESS_KEY_ID === 'test-access-key' ||
  env.S3_ACCESS_KEY_ID.startsWith('your_') ||
  !env.S3_SECRET_ACCESS_KEY ||
  env.S3_SECRET_ACCESS_KEY === 'your_secret_key' ||
  env.S3_SECRET_ACCESS_KEY === 'test-secret-key';

export const storageDriver: 's3' | 'local' =
  env.STORAGE_DRIVER === 's3'
    ? 's3'
    : env.STORAGE_DRIVER === 'local' || isPlaceholderKey
    ? 'local'
    : 's3';

export const s3Client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
});

export function getLocalStorageRoot(): string {
  const root = path.resolve(process.cwd(), env.LOCAL_STORAGE_PATH);
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

export function getLocalFilePath(key: string): string {
  // Normalize and prevent path traversal
  const safeKey = key.replace(/^[/\\]+/, '').replace(/\.\.[/\\]/g, '');
  return path.join(getLocalStorageRoot(), safeKey);
}

// Generate an HMAC signature for signed local bucket URLs
export function generateLocalSignature(key: string, expires: number): string {
  return crypto
    .createHmac('sha256', env.ENCRYPTION_KEY)
    .update(`${key}:${expires}`)
    .digest('hex');
}

export function verifyLocalSignature(key: string, expires: number, signature: string): boolean {
  if (Date.now() > expires) return false;
  const expected = generateLocalSignature(key, expires);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Generate a short-lived presigned PUT URL for direct client uploads
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900 // 15 minutes
): Promise<string> {
  if (storageDriver === 's3') {
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  // Local bucket storage presigned URL
  const expires = Date.now() + expiresInSeconds * 1000;
  const signature = generateLocalSignature(key, expires);
  const baseUrl = env.API_BASE_URL.replace(/\/+$/, '');
  return `${baseUrl}/api/v1/storage/upload/${key}?expires=${expires}&signature=${signature}`;
}

/**
 * Generate a short-lived presigned GET URL for downloading/viewing artifacts
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresInSeconds = 3600 // 1 hour
): Promise<string> {
  if (storageDriver === 's3') {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  }

  // Local bucket storage download URL
  const expires = Date.now() + expiresInSeconds * 1000;
  const signature = generateLocalSignature(key, expires);
  const baseUrl = env.API_BASE_URL.replace(/\/+$/, '');
  return `${baseUrl}/api/v1/storage/download/${key}?expires=${expires}&signature=${signature}`;
}

/**
 * Verify whether an object exists in storage and return its metadata
 */
export async function checkObjectExists(
  key: string
): Promise<{ exists: boolean; sizeBytes?: number; contentType?: string }> {
  if (storageDriver === 's3') {
    try {
      const response = await s3Client.send(
        new HeadObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
      );
      return {
        exists: true,
        sizeBytes: response.ContentLength,
        contentType: response.ContentType,
      };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return { exists: false };
      }
      logger.warn(`S3 HeadObject check failed for ${key}:`, err.message);
      return { exists: false };
    }
  }

  // Local storage check
  const localPath = getLocalFilePath(key);
  if (fs.existsSync(localPath)) {
    const stats = fs.statSync(localPath);
    return {
      exists: true,
      sizeBytes: stats.size,
      contentType: 'application/octet-stream',
    };
  }
  return { exists: false };
}

/**
 * Delete an object from storage
 */
export async function deleteStorageObject(key: string): Promise<void> {
  if (storageDriver === 's3') {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: key,
        })
      );
    } catch (err: any) {
      logger.warn(`Failed to delete S3 object ${key}:`, err.message);
    }
    return;
  }

  // Local storage delete
  try {
    const localPath = getLocalFilePath(key);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (err: any) {
    logger.warn(`Failed to delete local storage file ${key}:`, err.message);
  }
}

/**
 * Directly save a buffer to storage (used in tests, seeders, or internal artifact generation)
 */
export async function putStorageObject(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<void> {
  if (storageDriver === 's3') {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: Buffer.isBuffer(data) ? data : Buffer.from(data),
        ContentType: contentType,
      })
    );
    return;
  }

  const localPath = getLocalFilePath(key);
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(localPath, Buffer.isBuffer(data) ? data : Buffer.from(data));
}

// Log initialized storage driver mode
logger.info(`📦 Storage engine initialized using [${storageDriver.toUpperCase()}] mode`);

