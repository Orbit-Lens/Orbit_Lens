import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer): SocketIOServer {
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim());

  const io = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // JWT Authentication Middleware for WebSockets
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required for WebSocket'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch (err) {
      next(new Error('Invalid WebSocket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
      logger.debug(`Socket connected for user ${user.userId} (socketId: ${socket.id})`);
    }

    socket.on('join:job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      logger.debug(`Socket ${socket.id} joined room job:${jobId}`);
    });

    socket.on('leave:job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitJobUpdate(userId: string, jobId: string, data: any) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('job:update', data);
    ioInstance.to(`job:${jobId}`).emit('job:update', data);
  }
}
