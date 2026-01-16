import { Router } from 'express';
import {
  // Pets
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  // Skills
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  // Stage Groups
  getStageGroups,
  getStageGroupById,
  createStageGroup,
  updateStageGroup,
  deleteStageGroup,
  // Stages
  getStages,
  getStageById,
  createStage,
  updateStage,
  deleteStage,
  // Shop Items
  getShopItems,
  getShopItemById,
  createShopItem,
  updateShopItem,
  deleteShopItem,
} from '../controllers/adminController.js';

const router = Router();

// =====================================================
// Pet Routes
// =====================================================
router.get('/pets', getPets);
router.get('/pets/:id', getPetById);
router.post('/pets', createPet);
router.put('/pets/:id', updatePet);
router.delete('/pets/:id', deletePet);

// =====================================================
// Skill Routes
// =====================================================
router.get('/skills', getSkills);
router.get('/skills/:id', getSkillById);
router.post('/skills', createSkill);
router.put('/skills/:id', updateSkill);
router.delete('/skills/:id', deleteSkill);

// =====================================================
// Stage Group Routes
// =====================================================
router.get('/stage-groups', getStageGroups);
router.get('/stage-groups/:id', getStageGroupById);
router.post('/stage-groups', createStageGroup);
router.put('/stage-groups/:id', updateStageGroup);
router.delete('/stage-groups/:id', deleteStageGroup);

// =====================================================
// Stage Routes
// =====================================================
router.get('/stages', getStages);
router.get('/stages/:id', getStageById);
router.post('/stages', createStage);
router.put('/stages/:id', updateStage);
router.delete('/stages/:id', deleteStage);

// =====================================================
// Shop Item Routes
// =====================================================
router.get('/shop-items', getShopItems);
router.get('/shop-items/:id', getShopItemById);
router.post('/shop-items', createShopItem);
router.put('/shop-items/:id', updateShopItem);
router.delete('/shop-items/:id', deleteShopItem);

export default router;
