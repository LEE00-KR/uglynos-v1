-- =====================================================
-- 마이그레이션: 5스탯 → 4스탯 시스템
-- 실행 전 반드시 백업하세요!
-- =====================================================

-- =====================================================
-- 1. characters 테이블 수정
-- =====================================================

-- 1-1. 기존 5스탯 컬럼이 있으면 제거
ALTER TABLE characters DROP COLUMN IF EXISTS stat_str;
ALTER TABLE characters DROP COLUMN IF EXISTS stat_agi;
ALTER TABLE characters DROP COLUMN IF EXISTS stat_vit;
ALTER TABLE characters DROP COLUMN IF EXISTS stat_con;
ALTER TABLE characters DROP COLUMN IF EXISTS stat_int;

-- 1-2. 4스탯 컬럼 추가 (없는 경우)
ALTER TABLE characters ADD COLUMN IF NOT EXISTS stat_hp INTEGER DEFAULT 100;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS stat_atk INTEGER DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS stat_def INTEGER DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS stat_spd INTEGER DEFAULT 10;

-- 1-3. current_energy 추가 (기력 시스템)
ALTER TABLE characters ADD COLUMN IF NOT EXISTS current_energy INTEGER DEFAULT 100;

-- 1-4. current_hp 추가 (없는 경우)
ALTER TABLE characters ADD COLUMN IF NOT EXISTS current_hp INTEGER;

-- =====================================================
-- 2. pets 테이블 수정
-- =====================================================

-- 2-1. 기존 5스탯 컬럼 제거
ALTER TABLE pets DROP COLUMN IF EXISTS stat_str;
ALTER TABLE pets DROP COLUMN IF EXISTS stat_agi;
ALTER TABLE pets DROP COLUMN IF EXISTS stat_vit;
ALTER TABLE pets DROP COLUMN IF EXISTS stat_con;
ALTER TABLE pets DROP COLUMN IF EXISTS stat_int;

-- 2-2. 기존 5스탯 성장률 제거
ALTER TABLE pets DROP COLUMN IF EXISTS growth_str;
ALTER TABLE pets DROP COLUMN IF EXISTS growth_agi;
ALTER TABLE pets DROP COLUMN IF EXISTS growth_vit;
ALTER TABLE pets DROP COLUMN IF EXISTS growth_con;
ALTER TABLE pets DROP COLUMN IF EXISTS growth_int;

-- 2-3. 4스탯 컬럼 추가
ALTER TABLE pets ADD COLUMN IF NOT EXISTS stat_hp INTEGER NOT NULL DEFAULT 100;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS stat_atk INTEGER NOT NULL DEFAULT 10;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS stat_def INTEGER NOT NULL DEFAULT 10;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS stat_spd INTEGER NOT NULL DEFAULT 10;

-- 2-4. 4스탯 성장률 추가
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_hp DECIMAL(4,2) NOT NULL DEFAULT 5.00;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_atk DECIMAL(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_def DECIMAL(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_spd DECIMAL(4,2) NOT NULL DEFAULT 1.00;

-- 2-5. 성장 그룹 추가
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_group VARCHAR(1) NOT NULL DEFAULT 'C';

-- =====================================================
-- 3. admin_pets 테이블 수정
-- =====================================================

-- 3-1. 기존 5스탯 범위 컬럼 제거
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_str_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_str_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_agi_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_agi_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_vit_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_vit_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_con_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_con_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_int_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS base_int_max;

-- 3-2. 기존 5스탯 성장률 범위 제거
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_str_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_str_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_agi_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_agi_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_vit_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_vit_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_con_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_con_max;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_int_min;
ALTER TABLE admin_pets DROP COLUMN IF EXISTS growth_int_max;

-- 3-3. 4스탯 기본 범위 추가
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_hp_min INTEGER NOT NULL DEFAULT 80;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_hp_max INTEGER NOT NULL DEFAULT 120;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_atk_min INTEGER NOT NULL DEFAULT 8;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_atk_max INTEGER NOT NULL DEFAULT 12;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_def_min INTEGER NOT NULL DEFAULT 8;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_def_max INTEGER NOT NULL DEFAULT 12;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_spd_min INTEGER NOT NULL DEFAULT 8;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS base_spd_max INTEGER NOT NULL DEFAULT 12;

-- 3-4. 4스탯 보너스 풀 추가
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS bonus_hp INTEGER NOT NULL DEFAULT 10;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS bonus_atk INTEGER NOT NULL DEFAULT 2;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS bonus_def INTEGER NOT NULL DEFAULT 2;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS bonus_spd INTEGER NOT NULL DEFAULT 2;

-- 3-5. 4스탯 성장률 범위 추가
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_hp_min DECIMAL(4,2) NOT NULL DEFAULT 5.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_hp_max DECIMAL(4,2) NOT NULL DEFAULT 10.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_atk_min DECIMAL(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_atk_max DECIMAL(4,2) NOT NULL DEFAULT 2.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_def_min DECIMAL(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_def_max DECIMAL(4,2) NOT NULL DEFAULT 2.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_spd_min DECIMAL(4,2) NOT NULL DEFAULT 1.00;
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS growth_spd_max DECIMAL(4,2) NOT NULL DEFAULT 2.00;

-- 3-6. capture_rate 제거 (더 이상 사용 안함 - HP/레벨 기반 고정 공식)
ALTER TABLE admin_pets DROP COLUMN IF EXISTS capture_rate;

-- 3-7. total_stats 추가
ALTER TABLE admin_pets ADD COLUMN IF NOT EXISTS total_stats INTEGER NOT NULL DEFAULT 156;

-- =====================================================
-- 4. 테이블 이름 변경 (구버전 호환)
-- =====================================================

-- pet_templates → admin_pets (이미 admin_pets 사용 중이면 무시)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pet_templates') THEN
        -- 데이터 마이그레이션이 필요하면 여기에 INSERT INTO admin_pets SELECT FROM pet_templates
        DROP TABLE IF EXISTS pet_templates CASCADE;
    END IF;
END $$;

-- stage_templates → admin_stages (이미 admin_stages 사용 중이면 무시)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stage_templates') THEN
        DROP TABLE IF EXISTS stage_templates CASCADE;
    END IF;
END $$;

-- =====================================================
-- 5. 기존 데이터 기본값 설정
-- =====================================================

-- characters: current_hp가 NULL이면 stat_hp로 설정
UPDATE characters SET current_hp = stat_hp WHERE current_hp IS NULL;

-- pets: current_hp가 NULL이면 stat_hp로 설정
UPDATE pets SET current_hp = stat_hp WHERE current_hp IS NULL;

-- =====================================================
-- 마이그레이션 완료
-- =====================================================
