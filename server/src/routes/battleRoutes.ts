import { Router } from 'express';
import { authenticate, requireCharacter } from '../middlewares/authMiddleware.js';
import { battleStartLimiter } from '../middlewares/rateLimiter.js';
import * as battleController from '../controllers/battleController.js';
import { validate } from '../middlewares/validator.js';
import { startBattleSchema, battleActionSchema } from '../validators/battleValidator.js';

const router = Router();

router.use(authenticate);
router.use(requireCharacter);

router.post('/start', battleStartLimiter, validate(startBattleSchema), battleController.startBattle);
router.post('/action', validate(battleActionSchema), battleController.submitAction);
router.get('/:id', battleController.getBattleState);
router.post('/:id/flee', battleController.attemptFlee);

export default router;
