import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let mongodInstance: any = null;

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    logger.info(`✅ MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    logger.warn(`⚠️ Could not connect to remote MongoDB Atlas (${error.message}).`);
    
    if (env.NODE_ENV !== 'production') {
      try {
        logger.info('🚀 Starting local embedded MongoMemoryServer fallback for local development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const localUri = mongodInstance.getUri();
        
        await mongoose.connect(localUri);
        logger.info(`✅ Local embedded MongoDB active and ready at ${localUri}`);
      } catch (memErr: any) {
        logger.error('Failed to initialize local embedded MongoDB fallback:', memErr.message);
      }
    } else {
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
