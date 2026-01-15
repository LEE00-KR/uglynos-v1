import { Router } from 'express';
import { authenticate, withCharacter } from '../middlewares/authMiddleware.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);
router.use(withCharacter);

// 인벤토리 조회
router.get('/', inventoryController.getInventory);

// 장착된 아이템 조회
router.get('/equipped', inventoryController.getEquippedItems);

// 아이템 장착
router.post('/:inventoryId/equip', inventoryController.equipItem);

// 아이템 해제
router.post('/:inventoryId/unequip', inventoryController.unequipItem);

// 아이템 사용
router.post('/:inventoryId/use', inventoryController.useItem);

// 아이템 판매
router.post('/:inventoryId/sell', inventoryController.sellItem);

// 아이템 버리기
router.delete('/:inventoryId', inventoryController.discardItem);

export default router;
