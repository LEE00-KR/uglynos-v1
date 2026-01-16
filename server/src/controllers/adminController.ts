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

export const getPets = async (req: Request, res: Response, next: NextFunction) => {
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
        earth: row.element_earth,
        water: row.element_water,
        fire: row.element_fire,
        wind: row.element_wind,
      },
      baseStats: {
        hp: row.base_hp,
        atk: row.base_atk,
        def: row.base_def,
        spd: row.base_spd,
      },
      growthRates: {
        hp: parseFloat(row.growth_hp),
        atk: parseFloat(row.growth_atk),
        def: parseFloat(row.growth_def),
        spd: parseFloat(row.growth_spd),
      },
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
      return res.status(404).json({ success: false, error: { message: 'Pet not found' } });
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
        earth: row.element_earth,
        water: row.element_water,
        fire: row.element_fire,
        wind: row.element_wind,
      },
      baseStats: {
        hp: row.base_hp,
        atk: row.base_atk,
        def: row.base_def,
        spd: row.base_spd,
      },
      growthRates: {
        hp: parseFloat(row.growth_hp),
        atk: parseFloat(row.growth_atk),
        def: parseFloat(row.growth_def),
        spd: parseFloat(row.growth_spd),
      },
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

    // Validate element sum
    const elementSum = body.element.earth + body.element.water + body.element.fire + body.element.wind;
    if (elementSum !== 100) {
      return res.status(400).json({
        success: false,
        error: { message: 'Element ratios must sum to 100' },
      });
    }

    const { error } = await supabase.from('admin_pets').insert({
      id,
      name: body.name,
      element_earth: body.element.earth,
      element_water: body.element.water,
      element_fire: body.element.fire,
      element_wind: body.element.wind,
      base_hp: body.baseStats.hp,
      base_atk: body.baseStats.atk,
      base_def: body.baseStats.def,
      base_spd: body.baseStats.spd,
      growth_hp: body.growthRates.hp,
      growth_atk: body.growthRates.atk,
      growth_def: body.growthRates.def,
      growth_spd: body.growthRates.spd,
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
      const elementSum = body.element.earth + body.element.water + body.element.fire + body.element.wind;
      if (elementSum !== 100) {
        return res.status(400).json({
          success: false,
          error: { message: 'Element ratios must sum to 100' },
        });
      }
      updates.element_earth = body.element.earth;
      updates.element_water = body.element.water;
      updates.element_fire = body.element.fire;
      updates.element_wind = body.element.wind;
    }
    if (body.baseStats) {
      updates.base_hp = body.baseStats.hp;
      updates.base_atk = body.baseStats.atk;
      updates.base_def = body.baseStats.def;
      updates.base_spd = body.baseStats.spd;
    }
    if (body.growthRates) {
      updates.growth_hp = body.growthRates.hp;
      updates.growth_atk = body.growthRates.atk;
      updates.growth_def = body.growthRates.def;
      updates.growth_spd = body.growthRates.spd;
    }
    if (body.sprites) {
      updates.sprite_idle = body.sprites.idle;
      updates.sprite_attack = body.sprites.attack;
      updates.sprite_hit = body.sprites.hit;
      updates.sprite_defend = body.sprites.defend;
      updates.sprite_down = body.sprites.down;
      updates.sprite_walk = body.sprites.walk;
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

export const getSkills = async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(404).json({ success: false, error: { message: 'Skill not found' } });
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

export const getStageGroups = async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(404).json({ success: false, error: { message: 'Stage group not found' } });
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

export const getStages = async (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(404).json({ success: false, error: { message: 'Stage not found' } });
    }

    const stage: AdminStage = {
      id: row.id,
      name: row.name,
      background: row.background || '',
      monsters: row.monsters || [],
      wildPets: row.wild_pets || [],
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
// Shop Item Management
// =====================================================

export const getShopItems = async (req: Request, res: Response, next: NextFunction) => {
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
      price: row.price,
      currency: row.currency,
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
      return res.status(404).json({ success: false, error: { message: 'Shop item not found' } });
    }

    const shopItem: AdminShopItem = {
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      currency: row.currency,
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
      price: body.price,
      currency: body.currency || 'gold',
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
    if (body.price !== undefined) updates.price = body.price;
    if (body.currency !== undefined) updates.currency = body.currency;
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
