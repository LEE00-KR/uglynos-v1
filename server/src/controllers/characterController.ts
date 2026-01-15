import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as characterService from '../services/characterService.js';
import { CreateCharacterInput } from '../validators/characterValidator.js';

export const getCharacters = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const characters = await characterService.getCharactersByUserId(req.userId!);
    res.json({ success: true, data: characters });
  } catch (error) {
    next(error);
  }
};

export const getCharacter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const character = await characterService.getCharacterById(req.params.id, req.userId!);
    res.json({ success: true, data: character });
  } catch (error) {
    next(error);
  }
};

export const createCharacter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input: CreateCharacterInput = req.body;
    const character = await characterService.createCharacter(req.userId!, input);
    res.status(201).json({ success: true, data: character });
  } catch (error) {
    next(error);
  }
};

export const selectCharacter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await characterService.selectCharacter(req.params.id, req.userId!);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const distributeStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stats } = req.body;
    const character = await characterService.distributeStats(req.characterId!, stats);
    res.json({ success: true, data: character });
  } catch (error) {
    next(error);
  }
};
