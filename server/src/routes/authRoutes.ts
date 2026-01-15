import { Router } from 'express';
import { authLimiter } from '../middlewares/rateLimiter.js';
import * as authController from '../controllers/authController.js';
import { validate } from '../middlewares/validator.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

export default router;
