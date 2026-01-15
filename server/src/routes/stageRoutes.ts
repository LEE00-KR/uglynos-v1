import { Router } from 'express';
import { authenticate, requireCharacter } from '../middlewares/authMiddleware.js';
import * as stageController from '../controllers/stageController.js';

const router = Router();

router.use(authenticate);

router.get('/', stageController.getStages);
router.get('/:id', stageController.getStage);
router.get('/:id/progress', requireCharacter, stageController.getProgress);

export default router;
