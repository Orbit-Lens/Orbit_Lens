import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/orbitlens'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  ENCRYPTION_KEY: z.string().min(32).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  S3_ENDPOINT: z.string().default('https://s3.amazonaws.com'),
  S3_BUCKET: z.string().default('orbitlens-imagery'),
  S3_ACCESS_KEY_ID: z.string().default('test-access-key'),
  S3_SECRET_ACCESS_KEY: z.string().default('test-secret-key'),
  S3_REGION: z.string().default('ap-south-1'),
  S3_FORCE_PATH_STYLE: z.string().transform((v) => v === 'true').default('false'),
  STORAGE_DRIVER: z.enum(['auto', 's3', 'local']).default('auto'),
  LOCAL_STORAGE_PATH: z.string().default('./storage/bucket'),
  API_BASE_URL: z.string().default('http://localhost:5000'),
  PROCESSING_SERVICE_URL: z.string().default('http://localhost:8000'),
  PROCESSING_SERVICE_API_KEY: z.string().min(16).default('shared_internal_orbitlens_secret_key_123'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@orbitlens.app'),
  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
