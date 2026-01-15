-- Prehistoric Life MVP Database Schema
-- Version: 1.0
-- Date: 2026-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS & CHARACTERS
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT
);

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Basic info
  nickname VARCHAR(8) UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 1000,

  -- Appearance (random generation)
  appearance_eye INTEGER NOT NULL DEFAULT 1,
  appearance_nose INTEGER NOT NULL DEFAULT 1,
  appearance_mouth INTEGER NOT NULL DEFAULT 1,
  appearance_hair INTEGER NOT NULL DEFAULT 1,
  appearance_skin INTEGER NOT NULL DEFAULT 1,

  -- Element (compound possible)
  element_primary VARCHAR(10) NOT NULL DEFAULT 'earth',
  element_secondary VARCHAR(10),
  element_primary_ratio INTEGER DEFAULT 100,

  -- Base stats (initial 5 each + 20 points)
  stat_str INTEGER DEFAULT 5,
  stat_agi INTEGER DEFAULT 5,
  stat_vit INTEGER DEFAULT 5,
  stat_con INTEGER DEFAULT 5,
  stat_int INTEGER DEFAULT 5,
  stat_points INTEGER DEFAULT 20,

  -- Current state
  current_hp INTEGER,
  current_mp INTEGER,

  -- Riding pet
  riding_pet_id UUID,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_nickname ON characters(nickname);

-- =============================================
-- 2. PET SYSTEM
-- =============================================

CREATE TABLE pet_skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  element VARCHAR(10),

  damage_ratio INTEGER,
  effect_type VARCHAR(20),
  status_effect VARCHAR(20),
  mp_cost INTEGER DEFAULT 0,
  target_type VARCHAR(20) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pet_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  size VARCHAR(1) NOT NULL DEFAULT 'M',

  element_primary VARCHAR(10) NOT NULL,
  element_secondary VARCHAR(10),
  element_primary_ratio INTEGER DEFAULT 100,

  base_str INTEGER NOT NULL DEFAULT 5,
  base_agi INTEGER NOT NULL DEFAULT 5,
  base_vit INTEGER NOT NULL DEFAULT 5,
  base_con INTEGER NOT NULL DEFAULT 5,
  base_int INTEGER NOT NULL DEFAULT 5,

  skill_1_id INTEGER REFERENCES pet_skills(id),
  skill_2_id INTEGER REFERENCES pet_skills(id),

  capturable BOOLEAN DEFAULT TRUE,
  can_ride BOOLEAN DEFAULT FALSE,
  spawn_stage_min INTEGER,
  spawn_stage_max INTEGER,

  sprite_sheet VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES pet_templates(id),

  nickname VARCHAR(20),
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,

  stat_str INTEGER NOT NULL,
  stat_agi INTEGER NOT NULL,
  stat_vit INTEGER NOT NULL,
  stat_con INTEGER NOT NULL,
  stat_int INTEGER NOT NULL,

  growth_str INTEGER NOT NULL DEFAULT 100,
  growth_agi INTEGER NOT NULL DEFAULT 100,
  growth_vit INTEGER NOT NULL DEFAULT 100,
  growth_con INTEGER NOT NULL DEFAULT 100,
  growth_int INTEGER NOT NULL DEFAULT 100,

  loyalty INTEGER DEFAULT 50,
  current_hp INTEGER,
  current_mp INTEGER,

  party_slot INTEGER CHECK (party_slot BETWEEN 1 AND 3),
  is_riding BOOLEAN DEFAULT FALSE,
  is_rare_color BOOLEAN DEFAULT FALSE,
  is_starter BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pets_character_id ON pets(character_id);
CREATE INDEX idx_pets_party_slot ON pets(character_id, party_slot);

CREATE TABLE pet_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 10),
  stored_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, slot)
);

CREATE INDEX idx_pet_storage_character_id ON pet_storage(character_id);

-- Add foreign key for riding_pet_id after pets table is created
ALTER TABLE characters ADD CONSTRAINT fk_riding_pet
  FOREIGN KEY (riding_pet_id) REFERENCES pets(id) ON DELETE SET NULL;

-- =============================================
-- 3. EQUIPMENT SYSTEM
-- =============================================

CREATE TABLE spell_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  element VARCHAR(10),

  effect_type VARCHAR(20) NOT NULL,
  damage_ratio INTEGER,
  heal_ratio INTEGER,
  buff_type VARCHAR(20),
  buff_value INTEGER,
  buff_duration INTEGER,
  status_effect VARCHAR(20),

  mp_cost INTEGER NOT NULL DEFAULT 10,
  target_type VARCHAR(20) NOT NULL,
  status_chance INTEGER DEFAULT 90,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipment_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  slot_type VARCHAR(20) NOT NULL,
  weapon_type VARCHAR(20),

  required_level INTEGER DEFAULT 1,

  stat_str_min INTEGER DEFAULT 0, stat_str_max INTEGER DEFAULT 0,
  stat_agi_min INTEGER DEFAULT 0, stat_agi_max INTEGER DEFAULT 0,
  stat_vit_min INTEGER DEFAULT 0, stat_vit_max INTEGER DEFAULT 0,
  stat_con_min INTEGER DEFAULT 0, stat_con_max INTEGER DEFAULT 0,
  stat_int_min INTEGER DEFAULT 0, stat_int_max INTEGER DEFAULT 0,

  attack_ratio INTEGER DEFAULT 100,
  accuracy INTEGER DEFAULT 100,
  hit_count INTEGER DEFAULT 1,
  penalty_agi INTEGER DEFAULT 0,
  penalty_con INTEGER DEFAULT 0,

  icon VARCHAR(255),
  buy_price INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES equipment_templates(id),

  stat_str INTEGER DEFAULT 0,
  stat_agi INTEGER DEFAULT 0,
  stat_vit INTEGER DEFAULT 0,
  stat_con INTEGER DEFAULT 0,
  stat_int INTEGER DEFAULT 0,

  spell_id INTEGER REFERENCES spell_templates(id),

  durability INTEGER DEFAULT 100,
  max_durability INTEGER DEFAULT 100,

  is_equipped BOOLEAN DEFAULT FALSE,
  inventory_slot INTEGER CHECK (inventory_slot BETWEEN 1 AND 24),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_character_id ON equipment(character_id);
CREATE INDEX idx_equipment_is_equipped ON equipment(character_id, is_equipped);

-- =============================================
-- 4. INVENTORY SYSTEM
-- =============================================

CREATE TABLE consumable_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  effect_type VARCHAR(20) NOT NULL,
  effect_value INTEGER,
  cure_status VARCHAR(20),
  buy_price INTEGER,
  sell_price INTEGER,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_consumables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES consumable_templates(id),
  quantity INTEGER DEFAULT 1,
  inventory_slot INTEGER NOT NULL CHECK (inventory_slot BETWEEN 1 AND 24),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, inventory_slot)
);

CREATE INDEX idx_inventory_consumables_character_id ON inventory_consumables(character_id);

CREATE TABLE material_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  grade INTEGER NOT NULL DEFAULT 1,
  material_type VARCHAR(20) NOT NULL,
  sell_price INTEGER,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES material_templates(id),
  quantity INTEGER DEFAULT 1,
  inventory_slot INTEGER NOT NULL CHECK (inventory_slot BETWEEN 1 AND 24),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, inventory_slot)
);

CREATE INDEX idx_inventory_materials_character_id ON inventory_materials(character_id);

-- =============================================
-- 5. STAGE SYSTEM
-- =============================================

CREATE TABLE monster_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,

  element_primary VARCHAR(10) NOT NULL,
  element_secondary VARCHAR(10),
  element_primary_ratio INTEGER DEFAULT 100,

  base_hp INTEGER NOT NULL DEFAULT 100,
  base_mp INTEGER NOT NULL DEFAULT 50,
  base_str INTEGER NOT NULL DEFAULT 10,
  base_agi INTEGER NOT NULL DEFAULT 10,
  base_con INTEGER NOT NULL DEFAULT 10,

  growth_hp INTEGER DEFAULT 10,
  growth_mp INTEGER DEFAULT 5,
  growth_str INTEGER DEFAULT 2,
  growth_agi INTEGER DEFAULT 2,
  growth_con INTEGER DEFAULT 2,

  base_exp INTEGER NOT NULL DEFAULT 10,
  is_boss BOOLEAN DEFAULT FALSE,

  linked_pet_id INTEGER REFERENCES pet_templates(id),
  sprite_sheet VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stage_templates (
  id SERIAL PRIMARY KEY,
  chapter INTEGER NOT NULL DEFAULT 1,
  stage_number INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,

  stage_type VARCHAR(20) NOT NULL DEFAULT 'normal',
  wave_count INTEGER DEFAULT 1,

  recommended_level INTEGER NOT NULL DEFAULT 1,
  monster_level_min INTEGER NOT NULL DEFAULT 1,
  monster_level_max INTEGER NOT NULL DEFAULT 1,

  star_condition_2_turns INTEGER DEFAULT 10,
  star_condition_3_type VARCHAR(50),
  star_condition_3_value VARCHAR(100),

  exp_reward INTEGER NOT NULL DEFAULT 100,
  gold_reward INTEGER NOT NULL DEFAULT 50,

  unlock_stage_id INTEGER REFERENCES stage_templates(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter, stage_number)
);

CREATE INDEX idx_stage_templates_chapter ON stage_templates(chapter, stage_number);

CREATE TABLE stage_monsters (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER REFERENCES stage_templates(id) ON DELETE CASCADE,
  monster_id INTEGER REFERENCES monster_templates(id),
  wave_number INTEGER DEFAULT 1,
  spawn_count_min INTEGER DEFAULT 1,
  spawn_count_max INTEGER DEFAULT 3,
  is_boss BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stage_monsters_stage_id ON stage_monsters(stage_id);

CREATE TABLE stage_drops (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER REFERENCES stage_templates(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES material_templates(id),
  equipment_id INTEGER REFERENCES equipment_templates(id),
  consumable_id INTEGER REFERENCES consumable_templates(id),
  drop_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  quantity_min INTEGER DEFAULT 1,
  quantity_max INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stage_drops_stage_id ON stage_drops(stage_id);

CREATE TABLE stage_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES stage_templates(id),
  is_cleared BOOLEAN DEFAULT FALSE,
  best_stars INTEGER DEFAULT 0,
  clear_count INTEGER DEFAULT 0,
  first_clear_at TIMESTAMP,
  last_clear_at TIMESTAMP,
  UNIQUE(character_id, stage_id)
);

CREATE INDEX idx_stage_progress_character_id ON stage_progress(character_id);

-- =============================================
-- 6. DAILY DUNGEON
-- =============================================

CREATE TABLE daily_dungeon_templates (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  dungeon_level INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(50) NOT NULL,
  material_type VARCHAR(20) NOT NULL,
  recommended_level INTEGER NOT NULL DEFAULT 1,
  monster_level INTEGER NOT NULL DEFAULT 1,
  exp_reward INTEGER NOT NULL DEFAULT 100,
  gold_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day_of_week, dungeon_level)
);

CREATE TABLE daily_dungeon_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  dungeon_id INTEGER REFERENCES daily_dungeon_templates(id),
  is_unlocked BOOLEAN DEFAULT FALSE,
  clear_count INTEGER DEFAULT 0,
  last_clear_at TIMESTAMP,
  UNIQUE(character_id, dungeon_id)
);

CREATE INDEX idx_daily_dungeon_progress_character_id ON daily_dungeon_progress(character_id);

-- =============================================
-- 7. CRAFTING SYSTEM
-- =============================================

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  result_equipment_id INTEGER REFERENCES equipment_templates(id),
  gold_cost INTEGER NOT NULL DEFAULT 100,
  required_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipe_materials (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES material_templates(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  is_spell_material BOOLEAN DEFAULT FALSE,
  result_spell_id INTEGER REFERENCES spell_templates(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipe_materials_recipe_id ON recipe_materials(recipe_id);

-- =============================================
-- 8. SHOP, LOGS, MULTIPLAYER
-- =============================================

CREATE TABLE shop_items (
  id SERIAL PRIMARY KEY,
  consumable_id INTEGER REFERENCES consumable_templates(id),
  equipment_id INTEGER REFERENCES equipment_templates(id),
  price INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE battle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  battle_type VARCHAR(20) NOT NULL,
  stage_id INTEGER REFERENCES stage_templates(id),
  daily_dungeon_id INTEGER REFERENCES daily_dungeon_templates(id),
  result VARCHAR(10) NOT NULL,
  turns_taken INTEGER,
  stars_earned INTEGER DEFAULT 0,
  exp_earned INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0,
  party_composition JSONB,
  drops JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE INDEX idx_battle_logs_character_id ON battle_logs(character_id);
CREATE INDEX idx_battle_logs_started_at ON battle_logs(started_at);

CREATE TABLE party_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID REFERENCES characters(id),
  status VARCHAR(20) DEFAULT 'waiting',
  stage_id INTEGER REFERENCES stage_templates(id),
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES party_sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id),
  is_ready BOOLEAN DEFAULT FALSE,
  join_order INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, character_id)
);

CREATE INDEX idx_party_members_session_id ON party_members(session_id);
CREATE INDEX idx_party_members_character_id ON party_members(character_id);

-- =============================================
-- 9. FUNCTIONS & TRIGGERS
-- =============================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_party_sessions_updated_at
  BEFORE UPDATE ON party_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
