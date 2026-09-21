import { Request, Response, NextFunction } from 'express';
import * as imageService from './image.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export async function requestUploadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await imageService.requestUpload(req.user!.userId, req.body);
    return sendSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function confirmUploadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await imageService.confirmUpload(req.user!.userId, req.params.id, req.body);
    return sendSuccess(res, image, 200);
  } catch (error) {
    next(error);
  }
}

export async function getImagesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sensor = req.query.sensor as any;
    const projectId = req.query.projectId as string;
    const status = req.query.status as string;

    const { images, total } = await imageService.getImages(req.user!.userId, {
      page,
      limit,
      sensor,
      projectId,
      status,
    });

    return sendPaginated(
      res,
      images,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

export async function getImageByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await imageService.getImageById(req.user!.userId, req.params.id);
    return sendSuccess(res, image);
  } catch (error) {
    next(error);
  }
}

export async function getImageDownloadUrlHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const downloadUrl = await imageService.getImageDownloadUrl(req.user!.userId, req.params.id);
    return sendSuccess(res, { downloadUrl });
  } catch (error) {
    next(error);
  }
}

export async function updateImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const image = await imageService.updateImage(req.user!.userId, req.params.id, req.body);
    return sendSuccess(res, image);
  } catch (error) {
    next(error);
  }
}

export async function deleteImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await imageService.deleteImage(req.user!.userId, req.params.id);
    return sendSuccess(res, { message: 'Image record deleted successfully' });
  } catch (error) {
    next(error);
  }
}
