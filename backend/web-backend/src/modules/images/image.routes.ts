import { Router } from 'express';
import {
  requestUploadHandler,
  confirmUploadHandler,
  getImagesHandler,
  getImageByIdHandler,
  getImageDownloadUrlHandler,
  updateImageHandler,
  deleteImageHandler,
} from './image.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { uploadLimiter } from '../../middleware/rateLimiters.js';
import {
  requestUploadUrlSchema,
  confirmUploadSchema,
  updateImageSchema,
} from './image.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/upload-url', uploadLimiter, validate({ body: requestUploadUrlSchema }), requestUploadHandler);
router.post('/:id/confirm', validate({ body: confirmUploadSchema }), confirmUploadHandler);
router.get('/', getImagesHandler);
router.get('/:id', getImageByIdHandler);
router.get('/:id/download-url', getImageDownloadUrlHandler);
router.put('/:id', validate({ body: updateImageSchema }), updateImageHandler);
router.delete('/:id', deleteImageHandler);

export default router;
