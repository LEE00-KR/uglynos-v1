-- Phase 2: 마을, 상점, 인벤토리, 장비 시스템 스키마

-- =============================================
-- 아이템 템플릿 (모든 아이템의 기본 정보)
-- =============================================
CREATE TABLE IF NOT EXISTS item_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- weapon, armor, accessory, consumable, material, capture_item
  subtype VARCHAR(20), -- sword, axe, staff, helmet, chest, etc.
  rarity VARCHAR(20) DEFAULT 'common', -- common, uncommon, rare, epic, legendary
  level_required INTEGER DEFAULT 1,

  -- 장비 스탯 (장비 아이템만)
  stat_str INTEGER DEFAULT 0,
  stat_agi INTEGER DEFAULT 0,
  stat_vit INTEGER DEFAULT 0,
  stat_con INTEGER DEFAULT 0,
  stat_int INTEGER DEFAULT 0,

  -- 소모품 효과 (소모품만)
  effect_type VARCHAR(30), -- heal_hp, heal_mp, buff, capture
  effect_value INTEGER DEFAULT 0,
  effect_duration INTEGER DEFAULT 0, -- 턴 수

  -- 포획 아이템 (포획 아이템만)
  capture_rate_bonus INTEGER DEFAULT 0,

  -- 가격
  buy_price INTEGER DEFAULT 0,
  sell_price INTEGER DEFAULT 0,

  -- 스택 가능 여부
  stackable BOOLEAN DEFAULT false,
  max_stack INTEGER DEFAULT 1,

  -- 이미지
  icon_url VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 인벤토리 (캐릭터가 보유한 아이템)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  item_template_id INTEGER REFERENCES item_templates(id),
  quantity INTEGER DEFAULT 1,
  slot_index INTEGER, -- 인벤토리 슬롯 위치

  -- 장비 강화 정보
  enhancement_level INTEGER DEFAULT 0,

  -- 장비 추가 스탯 (랜덤 옵션)
  bonus_stat_str INTEGER DEFAULT 0,
  bonus_stat_agi INTEGER DEFAULT 0,
  bonus_stat_vit INTEGER DEFAULT 0,
  bonus_stat_con INTEGER DEFAULT 0,
  bonus_stat_int INTEGER DEFAULT 0,

  is_equipped BOOLEAN DEFAULT false,
  equipped_slot VARCHAR(20), -- weapon, helmet, chest, pants, boots, accessory1, accessory2

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 상점 (NPC 상점 정보)
-- =============================================
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  npc_name VARCHAR(50),
  shop_type VARCHAR(20) DEFAULT 'general', -- general, weapon, armor, potion, special
  icon_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 상점 아이템 (상점별 판매 아이템)
-- =============================================
CREATE TABLE IF NOT EXISTS shop_items (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
  item_template_id INTEGER REFERENCES item_templates(id),
  stock INTEGER DEFAULT -1, -- -1 = 무제한
  discount_percent INTEGER DEFAULT 0,
  level_required INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- NPC (마을 NPC 정보)
-- =============================================
CREATE TABLE IF NOT EXISTS npcs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  title VARCHAR(50), -- 직함 (예: "대장장이", "약초상")
  dialogue TEXT[], -- 대화 목록
  location VARCHAR(50), -- village, shop, blacksmith
  shop_id INTEGER REFERENCES shops(id), -- 연결된 상점
  icon_url VARCHAR(255),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 제작 레시피
-- =============================================
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  result_item_id INTEGER REFERENCES item_templates(id),
  result_quantity INTEGER DEFAULT 1,
  gold_cost INTEGER DEFAULT 0,
  level_required INTEGER DEFAULT 1,
  success_rate INTEGER DEFAULT 100, -- 성공 확률 %
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 제작 재료
-- =============================================
CREATE TABLE IF NOT EXISTS recipe_materials (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  item_template_id INTEGER REFERENCES item_templates(id),
  quantity INTEGER DEFAULT 1
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON inventory(character_id, is_equipped);
CREATE INDEX IF NOT EXISTS idx_shop_items_shop ON shop_items(shop_id);
