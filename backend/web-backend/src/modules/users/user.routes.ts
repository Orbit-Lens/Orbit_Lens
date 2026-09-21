import { Router } from 'express';
import {
  getProfileHandler,
  updateProfileHandler,
  exportDataHandler,
  deleteAccountHandler,
} from './user.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { updateUserSchema, deleteAccountSchema } from './user.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getProfileHandler);
router.put('/me', validate({ body: updateUserSchema }), updateProfileHandler);
router.get('/me/export', exportDataHandler);
router.delete('/me', validate({ body: deleteAccountSchema }), deleteAccountHandler);

export default router;
