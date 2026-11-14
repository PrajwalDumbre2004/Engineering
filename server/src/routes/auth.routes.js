import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { login, loginSchema, me, logout } from '../controllers/auth.controller.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many login attempts, try again later' },
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', verifyToken, me);
router.post('/logout', logout);

export default router;
