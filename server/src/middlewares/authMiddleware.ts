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
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = decoded.userId;
    req.characterId = decoded.characterId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
};

export const requireCharacter = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.characterId) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Character required' },
    });
    return;
  }
  next();
};

// Alias for requireCharacter - use when character context is needed but not strictly required
export const withCharacter = (
  _req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  // Character ID is already set by authenticate middleware if available in token
  // This just passes through - character ID may or may not be present
  next();
};
