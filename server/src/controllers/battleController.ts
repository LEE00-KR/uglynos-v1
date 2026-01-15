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

    // Submit character action
    await battleService.submitAction(req.characterId!, {
      battleId: input.battleId,
      actorId: req.characterId!,
      type: input.characterAction.type,
      targetId: input.characterAction.targetId,
      spellId: input.characterAction.spellId,
      itemId: input.characterAction.itemId,
    });

    // Submit pet actions
    for (const petAction of input.petActions) {
      await battleService.submitAction(req.characterId!, {
        battleId: input.battleId,
        actorId: petAction.petId,
        type: 'attack',
        targetId: petAction.targetId,
        skillId: petAction.skillId,
      });
    }

    // Process turn
    const result = await battleService.processTurn(input.battleId);
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
