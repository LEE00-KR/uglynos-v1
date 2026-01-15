import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import { shopService } from '../services/shopService.js';
import { supabase } from '../config/database.js';

// 모든 상점 조회
export const getShops = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shops = await shopService.getShops();
    res.json({ success: true, data: shops });
  } catch (error) {
    next(error);
  }
};

// 특정 상점 조회
export const getShop = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shopId = parseInt(req.params.shopId);
    const shop = await shopService.getShop(shopId);
    res.json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};

// 상점 아이템 목록 조회
export const getShopItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shopId = parseInt(req.params.shopId);
    const characterId = req.characterId;

    // 캐릭터 레벨 조회
    let characterLevel = 1;
    if (characterId) {
      const { data: character } = await supabase
        .from('characters')
        .select('level')
        .eq('id', characterId)
        .single();
      if (character) {
        characterLevel = character.level;
      }
    }

    const items = await shopService.getShopItems(shopId, characterLevel);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

// 아이템 구매
export const buyItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const characterId = req.characterId;
    const shopId = parseInt(req.params.shopId);
    const { itemTemplateId, quantity = 1 } = req.body;

    if (!characterId) {
      res.status(400).json({ success: false, message: '캐릭터를 선택해주세요' });
      return;
    }

    const result = await shopService.buyItem(characterId, shopId, itemTemplateId, quantity);
    res.json({
      success: true,
      data: result,
      message: `아이템을 구매했습니다 (-${result.totalPrice}G)`,
    });
  } catch (error) {
    next(error);
  }
};

// NPC 목록 조회
export const getNPCs = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const npcs = await shopService.getNPCs();
    res.json({ success: true, data: npcs });
  } catch (error) {
    next(error);
  }
};

// 특정 NPC 조회
export const getNPC = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const npcId = parseInt(req.params.npcId);
    const npc = await shopService.getNPC(npcId);
    res.json({ success: true, data: npc });
  } catch (error) {
    next(error);
  }
};
