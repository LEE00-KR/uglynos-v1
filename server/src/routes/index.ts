import { Router } from 'express';
import authRoutes from './authRoutes.js';
import characterRoutes from './characterRoutes.js';
import petRoutes from './petRoutes.js';
import battleRoutes from './battleRoutes.js';
import stageRoutes from './stageRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import shopRoutes from './shopRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/characters', characterRoutes);
router.use('/pets', petRoutes);
router.use('/battles', battleRoutes);
router.use('/stages', stageRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/shops', shopRoutes);
router.use('/admin', adminRoutes);

export default router;
