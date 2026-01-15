import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { RegisterInput, LoginInput } from '../validators/authValidator.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: LoginInput = req.body;
    const result = await authService.login(input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
