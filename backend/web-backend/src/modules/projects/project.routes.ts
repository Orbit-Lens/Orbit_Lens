import { Router } from 'express';
import {
  createProjectHandler,
  getProjectsHandler,
  getProjectByIdHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from './project.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from './project.schema.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate({ body: createProjectSchema }), createProjectHandler);
router.get('/', getProjectsHandler);
router.get('/:id', getProjectByIdHandler);
router.put('/:id', validate({ body: updateProjectSchema }), updateProjectHandler);
router.delete('/:id', deleteProjectHandler);

export default router;
