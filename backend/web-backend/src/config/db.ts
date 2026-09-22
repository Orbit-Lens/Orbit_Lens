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

  // Ensure default demo accounts are seeded if database is empty
  try {
    const { User } = await import('../modules/users/user.model.js');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('🌱 Database is empty, auto-seeding demo accounts...');
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Password123', salt);
      await User.create([
        {
          name: 'Sakthivel Prakash',
          email: 'sakthivel@orbitlens.app',
          passwordHash: hash,
          role: 'admin',
          institution: 'OrbitLens Research Lab / ISRO SAC',
          storageQuotaBytes: 20 * 1024 * 1024 * 1024,
          storageUsedBytes: 0,
          isVerified: true,
        },
        {
          name: 'Dr. Sarah Chen',
          email: 'sarah.chen@lunar-institute.org',
          passwordHash: hash,
          role: 'researcher',
          institution: 'Lunar & Planetary Science Institute',
          storageQuotaBytes: 10 * 1024 * 1024 * 1024,
          storageUsedBytes: 0,
          isVerified: true,
        },
      ]);
      logger.info('✅ Auto-seed completed successfully: sakthivel@orbitlens.app & sarah.chen@lunar-institute.org');
    }
  } catch (seedErr: any) {
    logger.warn(`Could not verify or auto-seed accounts: ${seedErr.message}`);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
