import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as stageService from '../services/stageService.js';

export const getStages = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stages = await stageService.getAllStages();
    res.json({ success: true, data: stages });
  } catch (error) {
    next(error);
  }
};

export const getStage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stageId = parseInt(req.params.id, 10);
    const stage = await stageService.getStageById(stageId);
    res.json({ success: true, data: stage });
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stageId = parseInt(req.params.id, 10);
    const progress = await stageService.getStageProgress(req.characterId!, stageId);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};
