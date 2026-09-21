import { Router } from 'express';
import { getMetricsOverviewHandler } from './metrics.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);
router.get('/overview', getMetricsOverviewHandler);

export default router;
