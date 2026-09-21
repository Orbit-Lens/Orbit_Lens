import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import {
  storageDriver,
  getLocalFilePath,
  verifyLocalSignature,
  getLocalStorageRoot,
} from '../../config/storage.js';
import { env } from '../../config/env.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { verifyAccessToken } from '../../utils/jwt.js';

function isAuthorized(req: Request, key: string): boolean {
  // Check signed URL signature
  const expires = Number(req.query.expires);
  const signature = req.query.signature as string;

  if (expires && signature && verifyLocalSignature(key, expires, signature)) {
    return true;
  }

  // Check Bearer token
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(auth.slice(7));
      if (payload?.userId) return true;
    } catch {
      // ignore
    }
  }

  // Check internal service key
  if (req.headers['x-internal-key'] === env.PROCESSING_SERVICE_API_KEY) {
    return true;
  }

  return false;
}

export async function handleLocalUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const key = (req.params as any)[0] || req.params.key;
    if (!key) {
      return sendError(res, 'VALIDATION_ERROR', 'Storage key is required', 400);
    }

    if (!isAuthorized(req, key)) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid or expired upload signature', 401);
    }

    const filePath = getLocalFilePath(key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stats = fs.statSync(filePath);
      return sendSuccess(res, {
        message: 'File uploaded successfully to local storage bucket',
        key,
        sizeBytes: stats.size,
      }, 200);
    });

    writeStream.on('error', (err) => {
      next(err);
    });
  } catch (error) {
    next(error);
  }
}

export async function handleLocalDownload(req: Request, res: Response, next: NextFunction) {
  try {
    const key = (req.params as any)[0] || req.params.key;
    if (!key) {
      return sendError(res, 'VALIDATION_ERROR', 'Storage key is required', 400);
    }

    if (!isAuthorized(req, key)) {
      return sendError(res, 'UNAUTHORIZED', 'Invalid or expired download signature', 401);
    }

    const filePath = getLocalFilePath(key);
    if (!fs.existsSync(filePath)) {
      return sendError(res, 'NOT_FOUND', 'Object not found in storage bucket', 404);
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.tif' || ext === '.tiff') contentType = 'image/tiff';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.json') contentType = 'application/json';

    res.setHeader('Content-Type', contentType);
    return res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
}

export async function handleStorageStatus(req: Request, res: Response) {
  return sendSuccess(res, {
    driver: storageDriver,
    bucket: env.S3_BUCKET,
    endpoint: storageDriver === 's3' ? env.S3_ENDPOINT : `${env.API_BASE_URL}/api/v1/storage`,
    localStoragePath: storageDriver === 'local' ? getLocalStorageRoot() : undefined,
  });
}
