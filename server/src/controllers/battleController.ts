import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as battleService from '../services/battleService.js';
import { StartBattleInput, BattleActionInput } from '../validators/battleValidator.js';

export const startBattle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input: StartBattleInput = req.body;
    const battle = await battleService.startBattle(req.characterId!, input);
    res.status(201).json({ success: true, data: battle });
  } catch (error) {
    next(error);
  }
};

export const submitAction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input: BattleActionInput = req.body;
    const result = await battleService.submitAction(req.characterId!, input);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getBattleState = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const state = await battleService.getBattleState(req.params.id, req.characterId!);
    res.json({ success: true, data: state });
  } catch (error) {
    next(error);
  }
};

export const attemptFlee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await battleService.attemptFlee(req.params.id, req.characterId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
