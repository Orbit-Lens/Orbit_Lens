import { Router } from 'express';
import { registerHandler, loginHandler, refreshHandler, logoutHandler } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import { authLimiter } from '../../middleware/rateLimiters.js';
import { requireAuth, optionalAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), registerHandler);
router.post('/login', authLimiter, validate({ body: loginSchema }), loginHandler);
router.post('/refresh', authLimiter, refreshHandler);
router.post('/logout', optionalAuth, logoutHandler);

export default router;
