import { Model, Types } from 'mongoose';

/**
 * Ensures the requesting user owns the resource, returning 404 (NOT_FOUND) instead of 403
 * to prevent resource ID enumeration attacks.
 */
export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string
): Promise<T> {
  if (!Types.ObjectId.isValid(resourceId)) {
    const err = new Error('Resource not found') as any;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const doc = await ModelClass.findOne({
    _id: new Types.ObjectId(resourceId),
    userId: new Types.ObjectId(userId),
  } as any);

  if (!doc) {
    const err = new Error('Resource not found') as any;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return doc as unknown as T;
}
