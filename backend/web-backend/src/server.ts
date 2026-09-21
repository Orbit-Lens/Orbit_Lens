import http from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/index.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create Express app and HTTP server
  const app = createApp();
  const httpServer = http.createServer(app);

  // 3. Initialize Socket.io
  initSocketIO(httpServer);

  // 4. Start listening
  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 OrbitLens Web Backend running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📡 Health Check: http://localhost:${env.PORT}/health`);
    logger.info(`🔍 Readiness Probe: http://localhost:${env.PORT}/ready`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      logger.info('Database connection closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});
