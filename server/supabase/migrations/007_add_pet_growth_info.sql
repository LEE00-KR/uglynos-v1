-- ============================================
-- 펫 스탯별 성장 정보 저장 (ISG 기반 시스템)
-- 유저에게 노출되지 않는 내부 데이터
-- ============================================

-- 1. user_pets 테이블에 성장 정보 컬럼 추가 (JSONB로 저장)
-- 구조: {
--   "baseGroup": "S++",
--   "perStatGroups": { "hp": "A", "atk": "S++", "def": "B", "spd": "S+" },
--   "perStatMultipliers": { "hp": 1.00, "atk": 1.04, "def": 0.97, "spd": 1.02 }
-- }
ALTER TABLE user_pets ADD COLUMN IF NOT EXISTS growth_info JSONB;

-- 2. 기존 펫들에 대해 기본값 설정 (레거시 마이그레이션)
-- 기존 growth_group이 있으면 그 값을 사용, 없으면 'B' 기본값
UPDATE user_pets
SET growth_info = jsonb_build_object(
  'baseGroup', COALESCE(growth_group, 'B'),
  'perStatGroups', jsonb_build_object(
    'hp', COALESCE(growth_group, 'B'),
    'atk', COALESCE(growth_group, 'B'),
    'def', COALESCE(growth_group, 'B'),
    'spd', COALESCE(growth_group, 'B')
  ),
  'perStatMultipliers', jsonb_build_object(
    'hp', CASE COALESCE(growth_group, 'B')
      WHEN 'S++' THEN 1.04
      WHEN 'S+' THEN 1.02
      WHEN 'S' THEN 1.01
      WHEN 'A' THEN 1.00
      WHEN 'B' THEN 0.97
      WHEN 'C' THEN 0.94
      WHEN 'D' THEN 0.90
      ELSE 0.97
    END,
    'atk', CASE COALESCE(growth_group, 'B')
      WHEN 'S++' THEN 1.04
      WHEN 'S+' THEN 1.02
      WHEN 'S' THEN 1.01
      WHEN 'A' THEN 1.00
      WHEN 'B' THEN 0.97
      WHEN 'C' THEN 0.94
      WHEN 'D' THEN 0.90
      ELSE 0.97
    END,
    'def', CASE COALESCE(growth_group, 'B')
      WHEN 'S++' THEN 1.04
      WHEN 'S+' THEN 1.02
      WHEN 'S' THEN 1.01
      WHEN 'A' THEN 1.00
      WHEN 'B' THEN 0.97
      WHEN 'C' THEN 0.94
      WHEN 'D' THEN 0.90
      ELSE 0.97
    END,
    'spd', CASE COALESCE(growth_group, 'B')
      WHEN 'S++' THEN 1.04
      WHEN 'S+' THEN 1.02
      WHEN 'S' THEN 1.01
      WHEN 'A' THEN 1.00
      WHEN 'B' THEN 0.97
      WHEN 'C' THEN 0.94
      WHEN 'D' THEN 0.90
      ELSE 0.97
    END
  )
)
WHERE growth_info IS NULL;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_pets_growth_info ON user_pets USING GIN (growth_info);

-- 4. 컬럼 설명
COMMENT ON COLUMN user_pets.growth_info IS '스탯별 성장 정보 (ISG 기반, 유저 비공개)';
