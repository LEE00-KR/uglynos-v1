import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email-based rate limiter for auth endpoints
// Uses email instead of IP to avoid issues with mobile networks (CGNAT)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per email per 15 minutes
  keyGenerator: (req: Request) => {
    // Use email as the key, fallback to IP if email not provided
    const email = req.body?.email?.toLowerCase();
    return email || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const battleStartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '전투 시작 요청이 너무 많습니다.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
