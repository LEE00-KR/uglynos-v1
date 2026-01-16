-- ============================================
-- Uglynos 성장률 시스템 데이터베이스 스키마
-- ============================================

-- 1. pet_templates 테이블 업데이트 (신규 컬럼 추가)
-- ============================================

-- 기본 초기치 범위 컬럼 추가
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_hp_min INTEGER DEFAULT 30;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_hp_max INTEGER DEFAULT 50;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_atk_min INTEGER DEFAULT 5;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_atk_max INTEGER DEFAULT 10;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_def_min INTEGER DEFAULT 5;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_def_max INTEGER DEFAULT 10;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_spd_min INTEGER DEFAULT 5;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS base_spd_max INTEGER DEFAULT 10;

-- 보너스 풀 범위 컬럼 추가
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS bonus_pool_min INTEGER DEFAULT 0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS bonus_pool_max INTEGER DEFAULT 5;

-- 성장률 범위 컬럼 추가
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_hp_min DECIMAL(5,2) DEFAULT 5.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_hp_max DECIMAL(5,2) DEFAULT 15.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_atk_min DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_atk_max DECIMAL(5,2) DEFAULT 2.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_def_min DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_def_max DECIMAL(5,2) DEFAULT 2.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_spd_min DECIMAL(5,2) DEFAULT 1.0;
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS growth_spd_max DECIMAL(5,2) DEFAULT 2.0;

-- 희귀도 컬럼 추가
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';

-- 최대 레벨 컬럼 추가
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS max_level INTEGER DEFAULT 99;

-- 진화 ID 컬럼 추가
ALTER TABLE pet_templates ADD COLUMN IF NOT EXISTS evolution_id INTEGER REFERENCES pet_templates(id);


-- 2. pets 테이블 업데이트 (신규 컬럼 추가)
-- ============================================

-- 기본 초기치 (숨김)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS base_initial_hp INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS base_initial_atk INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS base_initial_def INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS base_initial_spd INTEGER DEFAULT 0;

-- 보너스 스탯
ALTER TABLE pets ADD COLUMN IF NOT EXISTS bonus_hp INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS bonus_atk INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS bonus_def INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS bonus_spd INTEGER DEFAULT 0;

-- 최종 초기치 (공개)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS initial_hp INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS initial_atk INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS initial_def INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS initial_spd INTEGER DEFAULT 0;

-- 현재 스탯 (레벨업으로 증가)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_hp DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_atk DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_def DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_spd DECIMAL(10,2) DEFAULT 0;

-- 전투용 HP/MP
ALTER TABLE pets ADD COLUMN IF NOT EXISTS battle_hp INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS battle_mp INTEGER DEFAULT 50;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS max_mp INTEGER DEFAULT 50;

-- 성장 그룹
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_group VARCHAR(1) DEFAULT 'C';

-- 성장률 범위 (그룹 배율 적용됨)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_hp_min DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_hp_max DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_atk_min DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_atk_max DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_def_min DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_def_max DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_spd_min DECIMAL(5,2) DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_spd_max DECIMAL(5,2) DEFAULT 0;

-- 성장 기록 (JSON)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS growth_history JSONB DEFAULT '{"hp":[],"atk":[],"def":[],"spd":[]}';

-- 희귀 색상
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_rare_color BOOLEAN DEFAULT FALSE;

-- 경험치 컬럼 (이미 있을 수 있음)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS exp INTEGER DEFAULT 0;


-- 3. 인덱스 추가
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pets_growth_group ON pets(growth_group);
CREATE INDEX IF NOT EXISTS idx_pets_level ON pets(level);
CREATE INDEX IF NOT EXISTS idx_pet_templates_rarity ON pet_templates(rarity);


-- 4. 기존 데이터 마이그레이션 (기존 펫들의 성장률 초기화)
-- ============================================
-- 기존 펫들에 대해 성장 그룹 'C'를 기본으로 설정
UPDATE pets
SET growth_group = 'C',
    growth_hp_min = 3.5,
    growth_hp_max = 10.5,
    growth_atk_min = 0.7,
    growth_atk_max = 1.4,
    growth_def_min = 0.7,
    growth_def_max = 1.4,
    growth_spd_min = 0.7,
    growth_spd_max = 1.4
WHERE growth_group IS NULL OR growth_group = '';


-- 5. 예시 펫 템플릿 데이터 (삭제 후 재삽입용 주석)
-- ============================================
/*
INSERT INTO pet_templates (
  id, name, description,
  element_primary, element_secondary, element_primary_ratio,
  rarity,
  base_hp_min, base_hp_max,
  base_atk_min, base_atk_max,
  base_def_min, base_def_max,
  base_spd_min, base_spd_max,
  bonus_pool_min, bonus_pool_max,
  growth_hp_min, growth_hp_max,
  growth_atk_min, growth_atk_max,
  growth_def_min, growth_def_max,
  growth_spd_min, growth_spd_max,
  max_level
) VALUES
-- 불도마뱀 (Common Fire)
(1, '불도마뱀', '뜨거운 용암 지대에 서식하는 작은 도마뱀',
  'fire', NULL, 100,
  'common',
  30, 40,  -- HP: 30~40
  6, 10,   -- ATK: 6~10
  4, 8,    -- DEF: 4~8
  5, 9,    -- SPD: 5~9
  0, 5,    -- Bonus: 0~5
  5.0, 15.0,   -- Growth HP
  1.0, 2.0,    -- Growth ATK
  0.8, 1.5,    -- Growth DEF
  1.0, 1.8,    -- Growth SPD
  99),

-- 물결토끼 (Uncommon Water)
(2, '물결토끼', '맑은 호수 근처에서 발견되는 귀여운 토끼',
  'water', NULL, 100,
  'uncommon',
  35, 50,
  5, 8,
  6, 10,
  7, 12,
  2, 8,
  6.0, 18.0,
  0.9, 1.8,
  1.0, 2.0,
  1.2, 2.2,
  99),

-- 바위거북 (Rare Earth)
(3, '바위거북', '산악지대의 튼튼한 거북',
  'earth', NULL, 100,
  'rare',
  50, 70,
  4, 7,
  8, 14,
  3, 6,
  5, 12,
  8.0, 22.0,
  0.7, 1.5,
  1.5, 2.8,
  0.5, 1.2,
  99);
*/


-- 6. 뷰 생성 (펫 공개 정보)
-- ============================================
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
    WHEN 'S' THEN 3
    WHEN 'A' THEN 2
    WHEN 'B' THEN 1
    ELSE 0
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


-- 7. 함수: 성장 그룹 결정
-- ============================================
CREATE OR REPLACE FUNCTION determine_growth_group(
  base_atk INTEGER,
  base_def INTEGER,
  base_spd INTEGER,
  max_atk INTEGER,
  max_def INTEGER,
  max_spd INTEGER
) RETURNS CHAR(1) AS $$
DECLARE
  base_sum INTEGER;
  max_sum INTEGER;
  ratio DECIMAL(5,2);
BEGIN
  base_sum := base_atk + base_def + base_spd;
  max_sum := max_atk + max_def + max_spd;
  ratio := (base_sum::DECIMAL / max_sum) * 100;

  IF ratio >= 95 THEN RETURN 'S';
  ELSIF ratio >= 85 THEN RETURN 'A';
  ELSIF ratio >= 70 THEN RETURN 'B';
  ELSIF ratio >= 50 THEN RETURN 'C';
  ELSE RETURN 'D';
  END IF;
END;
$$ LANGUAGE plpgsql;
