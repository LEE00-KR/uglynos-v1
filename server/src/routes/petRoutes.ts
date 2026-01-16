import { Router } from 'express';
import { authenticate, requireCharacter } from '../middlewares/authMiddleware.js';
import * as petController from '../controllers/petController.js';

const router = Router();

router.use(authenticate);
router.use(requireCharacter);

router.get('/', petController.getPets);
router.get('/active', petController.getActivePets);
router.get('/storage', petController.getStoragePets);
router.get('/:id', petController.getPet);
router.patch('/:id/nickname', petController.updateNickname);
router.post('/:id/party', petController.addToParty);
router.delete('/:id/party', petController.removeFromParty);
router.post('/:id/ride', petController.setRiding);
router.delete('/:id/ride', petController.unsetRiding);
router.post('/:id/storage', petController.moveToStorage);
router.delete('/:id/storage', petController.moveFromStorage);
router.delete('/:id', petController.releasePet);

export default router;
