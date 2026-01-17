-- ============================================
-- 성장 그룹 시스템 업데이트 마이그레이션
-- S++/S+ 등급 추가, 확률 기반 시스템
-- ============================================

-- 1. growth_group 컬럼 타입 변경 (VARCHAR(1) -> VARCHAR(3))
-- S++, S+ 등급을 지원하기 위해 길이 확장
ALTER TABLE pets ALTER COLUMN growth_group TYPE VARCHAR(3);

-- 2. 기본값 변경 (B등급이 가장 흔하므로 기본값으로 설정)
ALTER TABLE pets ALTER COLUMN growth_group SET DEFAULT 'B';

-- 3. 뷰 업데이트 (별 개수 계산 업데이트)
CREATE OR REPLACE VIEW pet_public_info AS
SELECT
  p.id,
  p.character_id,
  p.nickname,
  p.level,
  p.exp,
  p.initial_hp,
  p.initial_atk,
  p.initial_def,
  p.initial_spd,
  FLOOR(p.current_hp) as current_hp,
  FLOOR(p.current_atk) as current_atk,
  FLOOR(p.current_def) as current_def,
  FLOOR(p.current_spd) as current_spd,
  p.battle_hp,
  p.battle_mp,
  p.max_mp,
  p.growth_group,
  CASE p.growth_group
    WHEN 'S++' THEN 5  -- 전설
    WHEN 'S+' THEN 4   -- 영웅
    WHEN 'S' THEN 3    -- 최상
    WHEN 'A' THEN 2    -- 상
    WHEN 'B' THEN 1    -- 중
    ELSE 0             -- C, D
  END as stars,
  p.is_rare_color,
  p.loyalty,
  pt.name as species_name,
  pt.element_primary,
  pt.element_secondary,
  pt.rarity,
  pt.image_url
FROM pets p
JOIN pet_templates pt ON p.template_id = pt.id;

-- 4. 성장 그룹 배수 테이블 (참조용)
-- 실제 계산은 서버 코드에서 수행
COMMENT ON COLUMN pets.growth_group IS '성장 그룹: S++(1.1x, 0.4%), S+(1.05x, 1%), S(1.0x, 2%), A(0.95x, 10%), B(0.9x, 50%), C(0.85x, 25%), D(0.8x, 11.6%)';

-- 5. 인덱스 재생성 (타입 변경 후)
DROP INDEX IF EXISTS idx_pets_growth_group;
CREATE INDEX idx_pets_growth_group ON pets(growth_group);
