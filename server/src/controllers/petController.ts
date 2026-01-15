import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import * as petService from '../services/petService.js';

export const getPets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pets = await petService.getPetsByCharacterId(req.characterId!);
    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

export const getPet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pet = await petService.getPetById(req.params.id, req.characterId!);
    res.json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

export const updateNickname = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { nickname } = req.body;
    const pet = await petService.updateNickname(req.params.id, req.characterId!, nickname);
    res.json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

export const addToParty = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slot } = req.body;
    await petService.addToParty(req.params.id, req.characterId!, slot);
    res.json({ success: true, message: '파티에 추가되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const removeFromParty = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.removeFromParty(req.params.id, req.characterId!);
    res.json({ success: true, message: '파티에서 제거되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const setRiding = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.setRiding(req.params.id, req.characterId!);
    res.json({ success: true, message: '탑승 설정되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const unsetRiding = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.unsetRiding(req.params.id, req.characterId!);
    res.json({ success: true, message: '탑승 해제되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const releasePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.releasePet(req.params.id, req.characterId!);
    res.json({ success: true, message: '펫을 야생으로 돌려보냈습니다' });
  } catch (error) {
    next(error);
  }
};
