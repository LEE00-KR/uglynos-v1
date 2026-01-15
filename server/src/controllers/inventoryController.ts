import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { inventoryService } from '../services/inventoryService.js';

// 인벤토리 조회
export const getInventory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const inventory = await inventoryService.getInventory(characterId);
    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

// 장착된 아이템 조회
export const getEquippedItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const equipped = await inventoryService.getEquippedItems(characterId);
    res.json({ success: true, data: equipped });
  } catch (error) {
    next(error);
  }
};

// 아이템 장착
export const equipItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    const { inventoryId } = req.params;

    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const equipped = await inventoryService.equipItem(characterId, inventoryId);
    res.json({ success: true, data: equipped, message: '아이템을 장착했습니다' });
  } catch (error) {
    next(error);
  }
};

// 아이템 해제
export const unequipItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    const { inventoryId } = req.params;

    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const unequipped = await inventoryService.unequipItem(characterId, inventoryId);
    res.json({ success: true, data: unequipped, message: '아이템을 해제했습니다' });
  } catch (error) {
    next(error);
  }
};

// 아이템 사용
export const useItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    const { inventoryId } = req.params;

    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const result = await inventoryService.useItem(characterId, inventoryId);
    res.json({ success: true, data: result, message: '아이템을 사용했습니다' });
  } catch (error) {
    next(error);
  }
};

// 아이템 판매
export const sellItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    const { inventoryId } = req.params;
    const { quantity = 1 } = req.body;

    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const result = await inventoryService.sellItem(characterId, inventoryId, quantity);
    res.json({
      success: true,
      data: result,
      message: `아이템을 판매하여 ${result.gold}G를 획득했습니다`,
    });
  } catch (error) {
    next(error);
  }
};

// 아이템 버리기
export const discardItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    const { inventoryId } = req.params;
    const { quantity = 1 } = req.body;

    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    await inventoryService.removeItem(characterId, inventoryId, quantity);
    res.json({ success: true, message: '아이템을 버렸습니다' });
  } catch (error) {
    next(error);
  }
};
