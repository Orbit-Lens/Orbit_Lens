import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redisConnection: Redis | null = null;
let registrationQueue: Queue | null = null;
let hasWarned = false;

try {
  redisConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 3000,
    retryStrategy(times) {
      if (times > 2) {
        if (!hasWarned) {
          logger.info('💡 Redis server not found locally. Operating in direct HTTP dispatch mode.');
          hasWarned = true;
        }
        return null; // Stop retrying and do not flood the console
      }
      return 1000;
    },
  });

  redisConnection.on('error', (err: any) => {
    if (!hasWarned) {
      logger.info(`💡 Redis notice (${err.code || err.message}). Operating in direct HTTP dispatch mode.`);
      hasWarned = true;
    }
  });

  redisConnection.on('connect', () => {
    logger.info('✅ Redis connected successfully. BullMQ queue active.');
    if (!registrationQueue) {
      try {
        registrationQueue = new Queue('orbitlens-registration', {
          connection: redisConnection!,
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        });
      } catch (qErr: any) {
        logger.warn('Failed to initialize BullMQ queue:', qErr.message);
      }
    }
  });

  // Attempt initial lazy connection without throwing uncaught rejection
  redisConnection.connect().catch(() => {
    // Handled by retryStrategy and error event handler
  });
} catch (err: any) {
  logger.info('💡 Redis not available. Operating in direct HTTP dispatch mode.');
}

export { redisConnection, registrationQueue };
