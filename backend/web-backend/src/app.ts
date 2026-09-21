import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { globalLimiter } from './middleware/rateLimiters.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendSuccess, sendError } from './utils/response.js';
import { redisConnection } from './config/queue.js';
import { getProcessingServiceHealth } from './services/processingClient.service.js';
import { storageDriver } from './config/storage.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import imageRoutes from './modules/images/image.routes.js';
import jobRoutes from './modules/jobs/job.routes.js';
import metricsRoutes from './modules/metrics/metrics.routes.js';
import storageRoutes from './modules/storage/storage.routes.js';

export function createApp() {
  const app = express();

  // 1. Security headers
  app.use(helmet());

  // 2. CORS configuration
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('CORS policy violation: Origin not allowed'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key'],
    })
  );

  // 3. Cookie parser for HttpOnly refresh tokens
  app.use(cookieParser());

  // 3b. Local Storage Engine routes (mounted before JSON body parser to enable raw binary streaming)
  app.use('/api/v1/storage', storageRoutes);

  // 4. Body parsing (5mb limit for metadata/JSON payloads, raw imagery uses direct S3 presigned PUT)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 5. NoSQL injection sanitization
  app.use(mongoSanitize());

  // 6. Development request logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // 7. Liveness probe (always returns 200 if Express is running)
  app.get('/health', (req: Request, res: Response) => {
    return sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'orbitlens-web-backend',
      version: '1.0.0',
    });
  });

  // 8. Readiness probe (checks MongoDB, Redis, and Processing Service)
  app.get('/ready', async (req: Request, res: Response) => {
    const mongoState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const mongoStatus =
      mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
    const redisStatus = redisConnection?.status === 'ready' ? 'connected' : 'standalone_direct_mode';
    const processingStatus = await getProcessingServiceHealth();

    const isReady = mongoState === 1;

    const data: Record<string, any> = {
      status: isReady ? 'ready' : 'not_ready',
      mongodb: {
        status: mongoStatus,
        ...(mongoState !== 1
          ? {
              troubleshooting:
                'MongoDB Atlas connection pending/rejected. Ensure your current IP is whitelisted in MongoDB Atlas (Network Access -> Add Current IP Address), or run local MongoDB.',
            }
          : {}),
      },
      redis: {
        status: redisStatus,
        mode: redisStatus === 'connected' ? 'bullmq_queue' : 'direct_http_dispatch',
      },
      storage: {
        driver: storageDriver,
        bucket: env.S3_BUCKET,
        status: 'active',
      },
      processingService: processingStatus,
    };

    if (isReady) {
      return sendSuccess(res, data, 200);
    } else {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DEPENDENCY_NOT_READY',
          message: 'One or more required backend dependencies (MongoDB) are not connected yet.',
        },
        data,
      });
    }
  });

  // 9. Apply global rate limiter to API routes
  app.use('/api', globalLimiter);

  // 10. API Route mounts
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/images', imageRoutes);
  app.use('/api/v1/jobs', jobRoutes);
  app.use('/api/v1/metrics', metricsRoutes);

  // 11. Handle 404 for unknown endpoints
  app.use('*', (req: Request, res: Response) => {
    return sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
  });

  // 12. Central error handler (always last)
  app.use(errorHandler);

  return app;
}
