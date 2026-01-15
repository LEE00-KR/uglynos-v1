import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  characterId?: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  userId?: string;
  characterId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.characterId = decoded.characterId;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
};

export const requireCharacter = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.characterId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Character required' },
    });
  }
  next();
};
