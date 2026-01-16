import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../config/database.js';
import type {
  AdminPet,
  AdminSkill,
  AdminStageGroup,
  AdminStage,
  AdminShopItem,
  CreateAdminPetRequest,
  CreateAdminSkillRequest,
  CreateAdminStageGroupRequest,
  CreateAdminStageRequest,
  CreateAdminShopItemRequest,
} from '../types/admin.js';

// Helper function to generate ID
const generateId = (prefix: string) => `${prefix}_${randomUUID().split('-')[0]}`;

// =====================================================
// Pet Management
// =====================================================

export const getPets = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('admin_pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const pets: AdminPet[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      element: {
        primary: row.element_primary,
        secondary: row.element_secondary || null,
        primaryRatio: row.element_primary_ratio,
      },
      baseStatsRange: {
        hp: { min: row.base_hp_min, max: row.base_hp_max },
        atk: { min: row.base_atk_min, max: row.base_atk_max },
        def: { min: row.base_def_min, max: row.base_def_max },
        spd: { min: row.base_spd_min, max: row.base_spd_max },
      },
      bonusPool: {
        hp: row.bonus_hp,
        atk: row.bonus_atk,
        def: row.bonus_def,
        spd: row.bonus_spd,
      },
      growthRatesRange: {
        hp: { min: parseFloat(row.growth_hp_min), max: parseFloat(row.growth_hp_max) },
        atk: { min: parseFloat(row.growth_atk_min), max: parseFloat(row.growth_atk_max) },
        def: { min: parseFloat(row.growth_def_min), max: parseFloat(row.growth_def_max) },
        spd: { min: parseFloat(row.growth_spd_min), max: parseFloat(row.growth_spd_max) },
      },
      totalStats: row.total_stats,
      captureRate: row.capture_rate ?? 50,
      sprites: {
        idle: row.sprite_idle || '',
        attack: row.sprite_attack || '',
        hit: row.sprite_hit || '',
        defend: row.sprite_defend || '',
        down: row.sprite_down || '',
        walk: row.sprite_walk || '',
      },
      skills: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Fetch skills for each pet
    for (const pet of pets) {
      const { data: skillData } = await supabase
        .from('admin_pet_skills')
        .select('skill_id')
        .eq('pet_id', pet.id)
        .order('slot', { ascending: true });

      pet.skills = (skillData || []).map((s) => s.skill_id);
    }

    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

export const getPetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: row, error } = await supabase
      .from('admin_pets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      res.status(404).json({ success: false, error: { message: 'Pet not found' } });
      return;
    }

    const { data: skillData } = await supabase
      .from('admin_pet_skills')
      .select('skill_id')
      .eq('pet_id', id)
      .order('slot', { ascending: true });

    const pet: AdminPet = {
      id: row.id,
      name: row.name,
      element: {
        primary: row.element_primary,
        secondary: row.element_secondary || null,
        primaryRatio: row.element_primary_ratio,
      },
      baseStatsRange: {
        hp: { min: row.base_hp_min, max: row.base_hp_max },
        atk: { min: row.base_atk_min, max: row.base_atk_max },
        def: { min: row.base_def_min, max: row.base_def_max },
        spd: { min: row.base_spd_min, max: row.base_spd_max },
      },
      bonusPool: {
        hp: row.bonus_hp,
        atk: row.bonus_atk,
        def: row.bonus_def,
        spd: row.bonus_spd,
      },
      growthRatesRange: {
        hp: { min: parseFloat(row.growth_hp_min), max: parseFloat(row.growth_hp_max) },
        atk: { min: parseFloat(row.growth_atk_min), max: parseFloat(row.growth_atk_max) },
        def: { min: parseFloat(row.growth_def_min), max: parseFloat(row.growth_def_max) },
        spd: { min: parseFloat(row.growth_spd_min), max: parseFloat(row.growth_spd_max) },
      },
      totalStats: row.total_stats,
      captureRate: row.capture_rate ?? 50,
      sprites: {
        idle: row.sprite_idle || '',
        attack: row.sprite_attack || '',
        hit: row.sprite_hit || '',
        defend: row.sprite_defend || '',
        down: row.sprite_down || '',
        walk: row.sprite_walk || '',
      },
      skills: (skillData || []).map((s) => s.skill_id),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

export const createPet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateAdminPetRequest = req.body;
    const id = body.id || generateId('pet');

    // Calculate total stats from max values
    const totalStats = body.baseStatsRange.hp.max +
                       body.baseStatsRange.atk.max +
                       body.baseStatsRange.def.max +
                       body.baseStatsRange.spd.max;

    const { error } = await supabase.from('admin_pets').insert({
      id,
      name: body.name,
      element_primary: body.element.primary,
      element_secondary: body.element.secondary || null,
      element_primary_ratio: body.element.primaryRatio,
      // Base stats range
      base_hp_min: body.baseStatsRange.hp.min,
      base_hp_max: body.baseStatsRange.hp.max,
      base_atk_min: body.baseStatsRange.atk.min,
      base_atk_max: body.baseStatsRange.atk.max,
      base_def_min: body.baseStatsRange.def.min,
      base_def_max: body.baseStatsRange.def.max,
      base_spd_min: body.baseStatsRange.spd.min,
      base_spd_max: body.baseStatsRange.spd.max,
      // Bonus pool
      bonus_hp: body.bonusPool.hp,
      bonus_atk: body.bonusPool.atk,
      bonus_def: body.bonusPool.def,
      bonus_spd: body.bonusPool.spd,
      // Growth rates range
      growth_hp_min: body.growthRatesRange.hp.min,
      growth_hp_max: body.growthRatesRange.hp.max,
      growth_atk_min: body.growthRatesRange.atk.min,
      growth_atk_max: body.growthRatesRange.atk.max,
      growth_def_min: body.growthRatesRange.def.min,
      growth_def_max: body.growthRatesRange.def.max,
      growth_spd_min: body.growthRatesRange.spd.min,
      growth_spd_max: body.growthRatesRange.spd.max,
      // Total stats
      total_stats: totalStats,
      // Capture rate
      capture_rate: body.captureRate ?? 50,
      // Sprites
      sprite_idle: body.sprites.idle,
      sprite_attack: body.sprites.attack,
      sprite_hit: body.sprites.hit,
      sprite_defend: body.sprites.defend,
      sprite_down: body.sprites.down,
      sprite_walk: body.sprites.walk,
    });

    if (error) throw error;

    // Insert skills
    if (body.skills && body.skills.length > 0) {
      const skillInserts = body.skills.map((skillId, index) => ({
        pet_id: id,
        skill_id: skillId,
        slot: index + 1,
      }));

      await supabase.from('admin_pet_skills').insert(skillInserts);
    }

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const updatePet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates: Record<string, unknown> = {};

    if (body.name) updates.name = body.name;
    if (body.element) {
      updates.element_primary = body.element.primary;
      updates.element_secondary = body.element.secondary || null;
      updates.element_primary_ratio = body.element.primaryRatio;
    }
    if (body.baseStatsRange) {
      updates.base_hp_min = body.baseStatsRange.hp.min;
      updates.base_hp_max = body.baseStatsRange.hp.max;
      updates.base_atk_min = body.baseStatsRange.atk.min;
      updates.base_atk_max = body.baseStatsRange.atk.max;
      updates.base_def_min = body.baseStatsRange.def.min;
      updates.base_def_max = body.baseStatsRange.def.max;
      updates.base_spd_min = body.baseStatsRange.spd.min;
      updates.base_spd_max = body.baseStatsRange.spd.max;
      // Recalculate total stats
      updates.total_stats = body.baseStatsRange.hp.max +
                            body.baseStatsRange.atk.max +
                            body.baseStatsRange.def.max +
                            body.baseStatsRange.spd.max;
    }
    if (body.bonusPool) {
      updates.bonus_hp = body.bonusPool.hp;
      updates.bonus_atk = body.bonusPool.atk;
      updates.bonus_def = body.bonusPool.def;
      updates.bonus_spd = body.bonusPool.spd;
    }
    if (body.growthRatesRange) {
      updates.growth_hp_min = body.growthRatesRange.hp.min;
      updates.growth_hp_max = body.growthRatesRange.hp.max;
      updates.growth_atk_min = body.growthRatesRange.atk.min;
      updates.growth_atk_max = body.growthRatesRange.atk.max;
      updates.growth_def_min = body.growthRatesRange.def.min;
      updates.growth_def_max = body.growthRatesRange.def.max;
      updates.growth_spd_min = body.growthRatesRange.spd.min;
      updates.growth_spd_max = body.growthRatesRange.spd.max;
    }
    if (body.sprites) {
      updates.sprite_idle = body.sprites.idle;
      updates.sprite_attack = body.sprites.attack;
      updates.sprite_hit = body.sprites.hit;
      updates.sprite_defend = body.sprites.defend;
      updates.sprite_down = body.sprites.down;
      updates.sprite_walk = body.sprites.walk;
    }
    if (body.captureRate !== undefined) {
      updates.capture_rate = body.captureRate;
    }

    const { error } = await supabase
      .from('admin_pets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Update skills if provided
    if (body.skills) {
      await supabase.from('admin_pet_skills').delete().eq('pet_id', id);

      if (body.skills.length > 0) {
        const skillInserts = body.skills.map((skillId: string, index: number) => ({
          pet_id: id,
          skill_id: skillId,
          slot: index + 1,
        }));

        await supabase.from('admin_pet_skills').insert(skillInserts);
      }
    }

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const deletePet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('admin_pets').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// Skill Management
// =====================================================

export const getSkills = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('admin_skills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const skills: AdminSkill[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      cost: row.cost,
      components: row.components || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
};

export const getSkillById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: row, error } = await supabase
      .from('admin_skills')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      res.status(404).json({ success: false, error: { message: 'Skill not found' } });
      return;
    }

    const skill: AdminSkill = {
      id: row.id,
      name: row.name,
      cost: row.cost,
      components: row.components || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({ success: true, data: skill });
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateAdminSkillRequest = req.body;
    const id = body.id || generateId('skill');

    const { error } = await supabase.from('admin_skills').insert({
      id,
      name: body.name,
      cost: body.cost,
      components: body.components,
    });

    if (error) throw error;

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.cost !== undefined) updates.cost = body.cost;
    if (body.components !== undefined) updates.components = body.components;

    const { error } = await supabase
      .from('admin_skills')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('admin_skills').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// Stage Group Management
// =====================================================

export const getStageGroups = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('admin_stage_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stageGroups: AdminStageGroup[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      background: row.background || '',
      stages: row.stages || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ success: true, data: stageGroups });
  } catch (error) {
    next(error);
  }
};

export const getStageGroupById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: row, error } = await supabase
      .from('admin_stage_groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      res.status(404).json({ success: false, error: { message: 'Stage group not found' } });
      return;
    }

    const stageGroup: AdminStageGroup = {
      id: row.id,
      name: row.name,
      background: row.background || '',
      stages: row.stages || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({ success: true, data: stageGroup });
  } catch (error) {
    next(error);
  }
};

export const createStageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateAdminStageGroupRequest = req.body;
    const id = body.id || generateId('group');

    const { error } = await supabase.from('admin_stage_groups').insert({
      id,
      name: body.name,
      background: body.background,
      stages: body.stages || [],
    });

    if (error) throw error;

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const updateStageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.background !== undefined) updates.background = body.background;
    if (body.stages !== undefined) updates.stages = body.stages;

    const { error } = await supabase
      .from('admin_stage_groups')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const deleteStageGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('admin_stage_groups').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// Individual Stage Management
// =====================================================

export const getStages = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('admin_stages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stages: AdminStage[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      background: row.background || '',
      monsters: row.monsters || [],
      wildPets: row.wild_pets || [],
      expReward: row.exp_reward || 100,
      goldReward: row.gold_reward || 50,
      starConditions: {
        star2Turns: row.star_condition_2_turns || 0,
        star3Type: row.star_condition_3_type || 'none',
        star3Value: row.star_condition_3_value || 0,
      },
      drops: row.drops || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ success: true, data: stages });
  } catch (error) {
    next(error);
  }
};

export const getStageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: row, error } = await supabase
      .from('admin_stages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      res.status(404).json({ success: false, error: { message: 'Stage not found' } });
      return;
    }

    const stage: AdminStage = {
      id: row.id,
      name: row.name,
      background: row.background || '',
      monsters: row.monsters || [],
      wildPets: row.wild_pets || [],
      expReward: row.exp_reward || 100,
      goldReward: row.gold_reward || 50,
      starConditions: {
        star2Turns: row.star_condition_2_turns || 0,
        star3Type: row.star_condition_3_type || 'none',
        star3Value: row.star_condition_3_value || 0,
      },
      drops: row.drops || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({ success: true, data: stage });
  } catch (error) {
    next(error);
  }
};

export const createStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateAdminStageRequest = req.body;
    const id = body.id || generateId('stage');

    const { error } = await supabase.from('admin_stages').insert({
      id,
      name: body.name,
      background: body.background,
      monsters: body.monsters || [],
      wild_pets: body.wildPets || [],
      exp_reward: body.expReward ?? 100,
      gold_reward: body.goldReward ?? 50,
      star_condition_2_turns: body.starConditions?.star2Turns ?? 0,
      star_condition_3_type: body.starConditions?.star3Type ?? 'none',
      star_condition_3_value: body.starConditions?.star3Value ?? 0,
      drops: body.drops || [],
    });

    if (error) throw error;

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const updateStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.background !== undefined) updates.background = body.background;
    if (body.monsters !== undefined) updates.monsters = body.monsters;
    if (body.wildPets !== undefined) updates.wild_pets = body.wildPets;
    if (body.expReward !== undefined) updates.exp_reward = body.expReward;
    if (body.goldReward !== undefined) updates.gold_reward = body.goldReward;
    if (body.starConditions !== undefined) {
      updates.star_condition_2_turns = body.starConditions.star2Turns;
      updates.star_condition_3_type = body.starConditions.star3Type;
      updates.star_condition_3_value = body.starConditions.star3Value;
    }
    if (body.drops !== undefined) updates.drops = body.drops;

    const { error } = await supabase
      .from('admin_stages')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const deleteStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('admin_stages').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// Shop Item Management (재화: stone 단일)
// =====================================================

export const getShopItems = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('admin_shop_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const shopItems: AdminShopItem[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      shopType: row.shop_type || 'general',
      price: row.price,
      icon: row.icon || '',
      description: row.description || '',
      effect: row.effect,
      stackable: row.stackable,
      maxStack: row.max_stack,
      available: row.available,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ success: true, data: shopItems });
  } catch (error) {
    next(error);
  }
};

export const getShopItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: row, error } = await supabase
      .from('admin_shop_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) {
      res.status(404).json({ success: false, error: { message: 'Shop item not found' } });
      return;
    }

    const shopItem: AdminShopItem = {
      id: row.id,
      name: row.name,
      category: row.category,
      shopType: row.shop_type || 'general',
      price: row.price,
      icon: row.icon || '',
      description: row.description || '',
      effect: row.effect,
      stackable: row.stackable,
      maxStack: row.max_stack,
      available: row.available,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({ success: true, data: shopItem });
  } catch (error) {
    next(error);
  }
};

export const createShopItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateAdminShopItemRequest = req.body;
    const id = body.id || generateId('item');

    const { error } = await supabase.from('admin_shop_items').insert({
      id,
      name: body.name,
      category: body.category,
      shop_type: body.shopType || 'general',
      price: body.price,
      icon: body.icon || '',
      description: body.description || '',
      effect: body.effect,
      stackable: body.stackable ?? true,
      max_stack: body.maxStack ?? 99,
      available: body.available ?? true,
    });

    if (error) throw error;

    res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const updateShopItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.shopType !== undefined) updates.shop_type = body.shopType;
    if (body.price !== undefined) updates.price = body.price;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.description !== undefined) updates.description = body.description;
    if (body.effect !== undefined) updates.effect = body.effect;
    if (body.stackable !== undefined) updates.stackable = body.stackable;
    if (body.maxStack !== undefined) updates.max_stack = body.maxStack;
    if (body.available !== undefined) updates.available = body.available;

    const { error } = await supabase
      .from('admin_shop_items')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};

export const deleteShopItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('admin_shop_items').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
};
