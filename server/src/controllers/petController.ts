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

// Storage (창고) endpoints
export const getActivePets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pets = await petService.getActivePets(req.characterId!);
    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

export const getStoragePets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pets = await petService.getStoragePets(req.characterId!);
    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

export const moveToStorage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.moveToStorage(req.params.id, req.characterId!);
    res.json({ success: true, message: '펫을 창고에 보관했습니다' });
  } catch (error) {
    next(error);
  }
};

export const moveFromStorage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.moveFromStorage(req.params.id, req.characterId!);
    res.json({ success: true, message: '펫을 창고에서 꺼냈습니다' });
  } catch (error) {
    next(error);
  }
};

// =============================================
// REPRESENTATIVE PET & STANDBY SLOT ENDPOINTS
// =============================================

export const setRepresentative = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.setRepresentative(req.params.id, req.characterId!);
    res.json({ success: true, message: '대표 펫으로 설정되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const unsetRepresentative = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.unsetRepresentative(req.params.id, req.characterId!);
    res.json({ success: true, message: '대표 펫 설정이 해제되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const setStandbySlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slot } = req.body;
    await petService.setStandbySlot(req.params.id, req.characterId!, slot);
    res.json({ success: true, message: `대기 슬롯 ${slot}에 배치되었습니다` });
  } catch (error) {
    next(error);
  }
};

export const clearStandbySlot = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await petService.clearStandbySlot(req.params.id, req.characterId!);
    res.json({ success: true, message: '대기 슬롯에서 제거되었습니다' });
  } catch (error) {
    next(error);
  }
};

export const getStandbyPets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pets = await petService.getStandbyPets(req.characterId!);
    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

export const getRepresentativePet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pet = await petService.getRepresentativePet(req.characterId!);
    res.json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};
