import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    // Redact any accidental tokens/passwords
    const sanitized = JSON.parse(
      JSON.stringify(metadata, (key, value) => {
        if (/password|secret|token|authorization|apiKey/i.test(key)) {
          return '[REDACTED]';
        }
        return value;
      })
    );
    msg += ` ${JSON.stringify(sanitized)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.NODE_ENV === 'production' ? json() : combine(colorize(), customFormat)
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
