import { Router } from 'express';
import { authenticate, requireCharacter } from '../middlewares/authMiddleware.js';
import * as characterController from '../controllers/characterController.js';
import { validate } from '../middlewares/validator.js';
import { createCharacterSchema } from '../validators/characterValidator.js';

const router = Router();

router.use(authenticate);

router.get('/', characterController.getCharacters);
router.post('/', validate(createCharacterSchema), characterController.createCharacter);
router.get('/:id', characterController.getCharacter);
router.post('/:id/select', characterController.selectCharacter);
router.patch('/:id/stats', requireCharacter, characterController.distributeStats);

export default router;
