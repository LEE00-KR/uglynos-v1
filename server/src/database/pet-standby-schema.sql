-- Pet Standby System Schema
-- 펫 대기 슬롯 및 대표 펫 시스템

-- 1. pets 테이블에 대기 슬롯 관련 컬럼 추가
-- ============================================

-- 대표 펫 여부 (캐릭터당 1마리만 대표로 지정 가능)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_representative BOOLEAN DEFAULT FALSE;

-- 대기 슬롯 번호 (1~4, null이면 대기 아님)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS standby_slot INTEGER DEFAULT NULL;

-- 2. 제약 조건 추가
-- ============================================

-- 대기 슬롯은 1~4만 허용
ALTER TABLE pets DROP CONSTRAINT IF EXISTS check_standby_slot_range;
ALTER TABLE pets ADD CONSTRAINT check_standby_slot_range
  CHECK (standby_slot IS NULL OR (standby_slot >= 1 AND standby_slot <= 4));

-- 3. 인덱스 추가
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pets_is_representative ON pets(character_id, is_representative) WHERE is_representative = TRUE;
CREATE INDEX IF NOT EXISTS idx_pets_standby_slot ON pets(character_id, standby_slot) WHERE standby_slot IS NOT NULL;

-- 4. 유니크 제약 (캐릭터당 대표 펫 1마리, 대기 슬롯 번호 중복 방지)
-- ============================================
-- 각 캐릭터는 하나의 대표 펫만 가질 수 있음
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_representative_pet
  ON pets(character_id) WHERE is_representative = TRUE;

-- 각 캐릭터의 대기 슬롯은 중복 불가
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_standby_slot
  ON pets(character_id, standby_slot) WHERE standby_slot IS NOT NULL;
