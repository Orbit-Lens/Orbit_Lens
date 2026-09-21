import { Router } from 'express';
import {
  createJobHandler,
  getJobsHandler,
  getJobByIdHandler,
  getJobMetricsHandler,
  getJobArtifactsHandler,
  deleteJobHandler,
  updateJobStatusInternalHandler,
} from './job.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { jobCreationLimiter } from '../../middleware/rateLimiters.js';
import {
  createJobSchema,
  updateJobStatusInternalSchema,
} from './job.schema.js';

const router = Router();

// Internal processing service callback (authenticated via X-Internal-Key header)
router.post(
  '/:id/status-internal',
  validate({ body: updateJobStatusInternalSchema }),
  updateJobStatusInternalHandler
);

// Protected public routes
router.use(requireAuth);

router.post('/', jobCreationLimiter, validate({ body: createJobSchema }), createJobHandler);
router.get('/', getJobsHandler);
router.get('/:id', getJobByIdHandler);
router.get('/:id/metrics', getJobMetricsHandler);
router.get('/:id/artifacts', getJobArtifactsHandler);
router.delete('/:id', deleteJobHandler);

export default router;
