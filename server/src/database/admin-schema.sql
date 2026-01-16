-- Uglynos Admin Schema
-- 기존 스키마 + PRD 혼합

-- =====================================================
-- 1. 스킬 관리 (admin_skills) - PRD 방식
-- 주의: admin_pet_skills에서 참조하므로 먼저 생성
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
-- 2. 페트 관리 (admin_pets) - Species 템플릿 방식
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_pets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,

  -- 속성 (기존 스키마 방식)
  element_primary VARCHAR(20) NOT NULL CHECK (element_primary IN ('earth', 'water', 'fire', 'wind')),
  element_secondary VARCHAR(20) CHECK (element_secondary IN ('earth', 'water', 'fire', 'wind', NULL)),
  element_primary_ratio INTEGER DEFAULT 100 CHECK (element_primary_ratio >= 0 AND element_primary_ratio <= 100),

  -- 기본 스텟 범위 (4스텟 시스템: 체력/공격력/방어력/순발력)
  -- HP: 1-999, ATK/DEF/SPD: 1-100
  base_hp_min INTEGER NOT NULL DEFAULT 80 CHECK (base_hp_min >= 1 AND base_hp_min <= 999),
  base_hp_max INTEGER NOT NULL DEFAULT 120 CHECK (base_hp_max >= 1 AND base_hp_max <= 999),
  base_atk_min INTEGER NOT NULL DEFAULT 8 CHECK (base_atk_min >= 1 AND base_atk_min <= 100),
  base_atk_max INTEGER NOT NULL DEFAULT 12 CHECK (base_atk_max >= 1 AND base_atk_max <= 100),
  base_def_min INTEGER NOT NULL DEFAULT 8 CHECK (base_def_min >= 1 AND base_def_min <= 100),
  base_def_max INTEGER NOT NULL DEFAULT 12 CHECK (base_def_max >= 1 AND base_def_max <= 100),
  base_spd_min INTEGER NOT NULL DEFAULT 8 CHECK (base_spd_min >= 1 AND base_spd_min <= 100),
  base_spd_max INTEGER NOT NULL DEFAULT 12 CHECK (base_spd_max >= 1 AND base_spd_max <= 100),

  -- 보너스 풀 (종족별 보너스 스탯 범위)
  bonus_hp INTEGER NOT NULL DEFAULT 10 CHECK (bonus_hp >= 0 AND bonus_hp <= 50),
  bonus_atk INTEGER NOT NULL DEFAULT 2 CHECK (bonus_atk >= 0 AND bonus_atk <= 10),
  bonus_def INTEGER NOT NULL DEFAULT 2 CHECK (bonus_def >= 0 AND bonus_def <= 10),
  bonus_spd INTEGER NOT NULL DEFAULT 2 CHECK (bonus_spd >= 0 AND bonus_spd <= 10),

  -- 성장률 범위 (4스텟 시스템)
  growth_hp_min DECIMAL(4,2) NOT NULL DEFAULT 1.30 CHECK (growth_hp_min >= 1.00 AND growth_hp_min <= 3.00),
  growth_hp_max DECIMAL(4,2) NOT NULL DEFAULT 1.70 CHECK (growth_hp_max >= 1.00 AND growth_hp_max <= 3.00),
  growth_atk_min DECIMAL(4,2) NOT NULL DEFAULT 1.30 CHECK (growth_atk_min >= 1.00 AND growth_atk_min <= 3.00),
  growth_atk_max DECIMAL(4,2) NOT NULL DEFAULT 1.70 CHECK (growth_atk_max >= 1.00 AND growth_atk_max <= 3.00),
  growth_def_min DECIMAL(4,2) NOT NULL DEFAULT 1.30 CHECK (growth_def_min >= 1.00 AND growth_def_min <= 3.00),
  growth_def_max DECIMAL(4,2) NOT NULL DEFAULT 1.70 CHECK (growth_def_max >= 1.00 AND growth_def_max <= 3.00),
  growth_spd_min DECIMAL(4,2) NOT NULL DEFAULT 1.30 CHECK (growth_spd_min >= 1.00 AND growth_spd_min <= 3.00),
  growth_spd_max DECIMAL(4,2) NOT NULL DEFAULT 1.70 CHECK (growth_spd_max >= 1.00 AND growth_spd_max <= 3.00),

  -- 총합 스탯 (자동 계산용, 성장 그룹 결정에 사용)
  -- total_stats = base_hp_max + base_atk_max + base_def_max + base_spd_max
  total_stats INTEGER NOT NULL DEFAULT 156,

  -- 스프라이트 (PRD 방식 - 6종, base64 이미지 또는 URL)
  sprite_idle TEXT,
  sprite_attack TEXT,
  sprite_hit TEXT,
  sprite_defend TEXT,
  sprite_down TEXT,
  sprite_walk TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
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
-- 3. 스테이지 단계 관리 (admin_stage_groups) - PRD 방식
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
-- 4. 개별 스테이지 관리 (admin_stages) - PRD 방식 + 보상/별조건/드롭
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

  -- 보상 시스템
  exp_reward INTEGER NOT NULL DEFAULT 100 CHECK (exp_reward >= 0),
  gold_reward INTEGER NOT NULL DEFAULT 50 CHECK (gold_reward >= 0),

  -- 별 조건 (3성 조건)
  -- star1: 클리어만 하면 획득
  -- star2: 특정 턴 내 클리어 (0이면 비활성화)
  -- star3: 특정 조건 (type + value)
  star_condition_2_turns INTEGER DEFAULT 0,
  star_condition_3_type VARCHAR(30) DEFAULT 'none' CHECK (star_condition_3_type IN ('none', 'no_death', 'full_hp', 'use_skill', 'element_kill')),
  star_condition_3_value INTEGER DEFAULT 0,

  -- 드롭 테이블 (JSON 배열)
  -- 예: [{"itemId": "item_001", "itemType": "material", "dropRate": 30, "minQty": 1, "maxQty": 3}]
  drops JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. 상점 관리 (admin_shop_items) - PRD 방식 + stone 단일 재화
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_shop_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('consumable', 'equipment', 'material', 'pet', 'etc')),
  price INTEGER NOT NULL CHECK (price >= 0),
  -- 재화는 stone 단일
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
