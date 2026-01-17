-- ============================================
-- 스탯 및 성장률에 기준값(base) 컬럼 추가
-- min / base / max 구조로 변경
-- ============================================

-- 1. admin_pets 테이블에 기준값 컬럼 추가
-- 기본 스탯 기준값
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_hp_base INTEGER NOT NULL DEFAULT 100;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_atk_base INTEGER NOT NULL DEFAULT 10;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_def_base INTEGER NOT NULL DEFAULT 10;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_spd_base INTEGER NOT NULL DEFAULT 10;

-- 성장률 기준값
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_hp_base DECIMAL(4,2) NOT NULL DEFAULT 7.50;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_atk_base DECIMAL(4,2) NOT NULL DEFAULT 1.50;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_def_base DECIMAL(4,2) NOT NULL DEFAULT 1.50;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_spd_base DECIMAL(4,2) NOT NULL DEFAULT 1.50;

-- 2. 기존 데이터 마이그레이션 (base = (min + max) / 2)
UPDATE admin_pets SET
  base_hp_base = (base_hp_min + base_hp_max) / 2,
  base_atk_base = (base_atk_min + base_atk_max) / 2,
  base_def_base = (base_def_min + base_def_max) / 2,
  base_spd_base = (base_spd_min + base_spd_max) / 2,
  growth_hp_base = (growth_hp_min + growth_hp_max) / 2,
  growth_atk_base = (growth_atk_min + growth_atk_max) / 2,
  growth_def_base = (growth_def_min + growth_def_max) / 2,
  growth_spd_base = (growth_spd_min + growth_spd_max) / 2;

-- 3. bonus_pool 컬럼 제거 (base/min/max로 대체되므로)
ALTER TABLE admin_pets DROP COLUMN IF EXISTS bonus_hp;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS bonus_atk;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS bonus_def;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS bonus_spd;

-- 4. total_stats 컬럼 제거 (더 이상 사용하지 않음)
ALTER TABLE admin_pets DROP COLUMN IF EXISTS total_stats;

-- 5. 컬럼 설명 추가
COMMENT ON COLUMN admin_pets.base_hp_base IS '기본 HP 기준값';
COMMENT ON COLUMN admin_pets.base_hp_min IS '기본 HP 최소값';
COMMENT ON COLUMN admin_pets.base_hp_max IS '기본 HP 최대값';
COMMENT ON COLUMN admin_pets.growth_hp_base IS '성장률 HP 기준값';
COMMENT ON COLUMN admin_pets.growth_hp_min IS '성장률 HP 최소값';
COMMENT ON COLUMN admin_pets.growth_hp_max IS '성장률 HP 최대값';
