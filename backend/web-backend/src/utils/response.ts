import { Response } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  fields?: Record<string, string[]>
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
  });
}
