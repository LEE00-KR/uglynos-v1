import { Router } from 'express';
import { authenticate, withCharacter } from '../middlewares/authMiddleware.js';
import * as shopController from '../controllers/shopController.js';

const router = Router();

// 인증 필요
router.use(authenticate);

// 상점 목록 조회
router.get('/', shopController.getShops);

// 특정 상점 조회
router.get('/:shopId', shopController.getShop);

// 상점 아이템 목록 조회
router.get('/:shopId/items', withCharacter, shopController.getShopItems);

// 아이템 구매
router.post('/:shopId/buy', withCharacter, shopController.buyItem);

// NPC 목록 조회
router.get('/npcs/all', shopController.getNPCs);

// 특정 NPC 조회
router.get('/npcs/:npcId', shopController.getNPC);

export default router;
