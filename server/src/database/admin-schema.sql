-- Uglynos Admin Schema
-- PRD 기반 어드민 관리용 테이블

-- =====================================================
-- 1. 페트 관리 (admin_pets)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_pets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,

  -- 속성 비율 (합계 100%)
  element_earth INTEGER DEFAULT 0 CHECK (element_earth >= 0 AND element_earth <= 100),
  element_water INTEGER DEFAULT 0 CHECK (element_water >= 0 AND element_water <= 100),
  element_fire INTEGER DEFAULT 0 CHECK (element_fire >= 0 AND element_fire <= 100),
  element_wind INTEGER DEFAULT 0 CHECK (element_wind >= 0 AND element_wind <= 100),

  -- 기본 스텟
  base_hp INTEGER NOT NULL CHECK (base_hp >= 1 AND base_hp <= 100),
  base_atk INTEGER NOT NULL CHECK (base_atk >= 1 AND base_atk <= 20),
  base_def INTEGER NOT NULL CHECK (base_def >= 1 AND base_def <= 20),
  base_spd INTEGER NOT NULL CHECK (base_spd >= 1 AND base_spd <= 20),

  -- 성장률
  growth_hp DECIMAL(5,2) NOT NULL CHECK (growth_hp >= 1.00 AND growth_hp <= 30.00),
  growth_atk DECIMAL(4,2) NOT NULL CHECK (growth_atk >= 1.00 AND growth_atk <= 3.00),
  growth_def DECIMAL(4,2) NOT NULL CHECK (growth_def >= 1.00 AND growth_def <= 3.00),
  growth_spd DECIMAL(4,2) NOT NULL CHECK (growth_spd >= 1.00 AND growth_spd <= 3.00),

  -- 스프라이트
  sprite_idle VARCHAR(500),
  sprite_attack VARCHAR(500),
  sprite_hit VARCHAR(500),
  sprite_defend VARCHAR(500),
  sprite_down VARCHAR(500),
  sprite_walk VARCHAR(500),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT check_element_sum CHECK (
    element_earth + element_water + element_fire + element_wind = 100
  )
);

-- 페트-스킬 연결 테이블
CREATE TABLE IF NOT EXISTS admin_pet_skills (
  id SERIAL PRIMARY KEY,
  pet_id VARCHAR(50) REFERENCES admin_pets(id) ON DELETE CASCADE,
  skill_id VARCHAR(50) REFERENCES admin_skills(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot >= 1),
  UNIQUE(pet_id, skill_id),
  UNIQUE(pet_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_admin_pet_skills_pet_id ON admin_pet_skills(pet_id);

-- =====================================================
-- 2. 스킬 관리 (admin_skills)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_skills (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 0),

  -- 스킬 구성 요소 (JSON 배열)
  -- 예: [{"type": "attack"}, {"type": "attackPercent", "percent": 150}]
  components JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. 스테이지 단계 관리 (admin_stage_groups)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_stage_groups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  background VARCHAR(500),

  -- 스테이지 배치 (JSON 배열)
  -- 예: [{"stageId": "stage_001", "x": 100, "y": 200, "order": 1}]
  stages JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. 개별 스테이지 관리 (admin_stages)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_stages (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  background VARCHAR(500),

  -- 몬스터 배치 (JSON 배열, 1~10)
  -- 예: [{"petId": "pet_001", "slot": 1, "level": 5, "stats": {...}, "skills": [...]}]
  monsters JSONB NOT NULL DEFAULT '[]',

  -- 출현 페트 (JSON 배열, 1~2)
  -- 예: [{"petId": "pet_003", "spawnRate": 30}]
  wild_pets JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. 상점 관리 (admin_shop_items)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_shop_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('consumable', 'equipment', 'material', 'pet', 'etc')),
  price INTEGER NOT NULL CHECK (price >= 0),
  currency VARCHAR(20) NOT NULL DEFAULT 'gold' CHECK (currency IN ('gold', 'cash', 'point')),
  icon VARCHAR(500),
  description TEXT,

  -- 효과 (JSON)
  -- 예: {"type": "heal", "target": "hp", "value": 50}
  effect JSONB,

  stackable BOOLEAN DEFAULT TRUE,
  max_stack INTEGER DEFAULT 99,
  available BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. 캐릭터 대표 페트 필드 추가
-- =====================================================
-- characters 테이블에 representative_pet_id 컬럼 추가
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS representative_pet_id UUID REFERENCES pets(id) ON DELETE SET NULL;

-- =====================================================
-- 인덱스 생성
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admin_pets_name ON admin_pets(name);
CREATE INDEX IF NOT EXISTS idx_admin_skills_name ON admin_skills(name);
CREATE INDEX IF NOT EXISTS idx_admin_stage_groups_name ON admin_stage_groups(name);
CREATE INDEX IF NOT EXISTS idx_admin_stages_name ON admin_stages(name);
CREATE INDEX IF NOT EXISTS idx_admin_shop_items_category ON admin_shop_items(category);
CREATE INDEX IF NOT EXISTS idx_admin_shop_items_available ON admin_shop_items(available);

-- =====================================================
-- 트리거: updated_at 자동 갱신
-- =====================================================
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER admin_pets_updated_at
  BEFORE UPDATE ON admin_pets
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE OR REPLACE TRIGGER admin_skills_updated_at
  BEFORE UPDATE ON admin_skills
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE OR REPLACE TRIGGER admin_stage_groups_updated_at
  BEFORE UPDATE ON admin_stage_groups
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE OR REPLACE TRIGGER admin_stages_updated_at
  BEFORE UPDATE ON admin_stages
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

CREATE OR REPLACE TRIGGER admin_shop_items_updated_at
  BEFORE UPDATE ON admin_shop_items
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();
