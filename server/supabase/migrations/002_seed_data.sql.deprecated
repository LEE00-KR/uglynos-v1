-- Prehistoric Life MVP Seed Data
-- Version: 1.0
-- Date: 2026-01-15

-- =============================================
-- PET SKILLS
-- =============================================

INSERT INTO pet_skills (name, description, element, damage_ratio, effect_type, target_type, mp_cost) VALUES
('물기', '기본 물리 공격', NULL, 100, 'damage', 'single', 0),
('할퀴기', '날카로운 발톱으로 공격', NULL, 90, 'damage', 'single', 0),
('박치기', '머리로 세게 받아침', NULL, 110, 'damage', 'single', 0),
('땅 가르기', '땅을 갈라 공격', 'earth', 120, 'damage', 'single', 10),
('바람 칼날', '바람으로 베어냄', 'wind', 120, 'damage', 'single', 10),
('화염 숨결', '불을 내뿜음', 'fire', 120, 'damage', 'single', 10),
('물 대포', '물을 발사', 'water', 120, 'damage', 'single', 10),
('돌 던지기', '돌을 던짐', 'earth', 80, 'damage', 'all_enemies', 15),
('독 공격', '독을 주입', NULL, 60, 'damage', 'single', 8),
('치료', '체력 회복', NULL, NULL, 'heal', 'single', 20);

UPDATE pet_skills SET status_effect = 'poison' WHERE name = '독 공격';

-- =============================================
-- PET TEMPLATES (Starter + Basic)
-- =============================================

INSERT INTO pet_templates (name, description, size, element_primary, base_str, base_agi, base_vit, base_con, base_int, skill_1_id, skill_2_id, capturable, can_ride) VALUES
('아기 공룡', '귀여운 스타터 펫', 'S', 'earth', 6, 5, 6, 5, 5, 1, 4, FALSE, FALSE),
('초록 슬라임', '물컹물컹한 슬라임', 'S', 'earth', 4, 6, 5, 4, 8, 2, 9, TRUE, FALSE),
('화염 도마뱀', '불을 뿜는 도마뱀', 'S', 'fire', 7, 6, 5, 5, 4, 1, 6, TRUE, FALSE),
('물 정령', '물로 이루어진 정령', 'S', 'water', 4, 7, 4, 4, 8, 7, 10, TRUE, FALSE),
('바람 새', '빠른 새', 'S', 'wind', 5, 9, 4, 4, 5, 5, 2, TRUE, FALSE),
('돌 골렘', '단단한 골렘', 'M', 'earth', 8, 3, 9, 8, 3, 3, 4, TRUE, TRUE),
('화염 호랑이', '불꽃을 두른 호랑이', 'M', 'fire', 9, 7, 6, 5, 4, 1, 6, TRUE, TRUE),
('얼음 늑대', '차가운 늑대', 'M', 'water', 7, 8, 5, 5, 6, 2, 7, TRUE, TRUE),
('번개 독수리', '전기를 다루는 독수리', 'M', 'wind', 6, 10, 4, 4, 7, 5, 8, TRUE, TRUE),
('대지 거북', '거대한 거북', 'L', 'earth', 6, 2, 12, 10, 5, 3, 4, TRUE, TRUE);

-- =============================================
-- MONSTER TEMPLATES
-- =============================================

INSERT INTO monster_templates (name, element_primary, base_hp, base_mp, base_str, base_agi, base_con, base_exp, linked_pet_id) VALUES
('초록 슬라임', 'earth', 80, 30, 8, 10, 6, 10, 2),
('화염 도마뱀', 'fire', 90, 40, 12, 12, 8, 15, 3),
('물 정령', 'water', 70, 60, 8, 14, 6, 15, 4),
('바람 새', 'wind', 60, 40, 10, 18, 5, 12, 5),
('돌 골렘', 'earth', 150, 20, 15, 5, 15, 25, 6),
('화염 호랑이', 'fire', 120, 50, 18, 14, 10, 30, 7),
('얼음 늑대', 'water', 110, 55, 16, 16, 9, 28, 8),
('번개 독수리', 'wind', 100, 45, 14, 20, 7, 26, 9),
('대지 거북', 'earth', 200, 30, 12, 4, 20, 40, 10);

-- Boss monsters
INSERT INTO monster_templates (name, element_primary, base_hp, base_mp, base_str, base_agi, base_con, base_exp, is_boss) VALUES
('슬라임 킹', 'earth', 300, 100, 20, 8, 18, 100, TRUE),
('화염 드래곤', 'fire', 400, 150, 30, 15, 25, 200, TRUE),
('빙결 서펜트', 'water', 350, 200, 25, 18, 22, 180, TRUE),
('폭풍 피닉스', 'wind', 320, 180, 28, 22, 20, 190, TRUE);

-- =============================================
-- STAGE TEMPLATES (1-10)
-- =============================================

INSERT INTO stage_templates (chapter, stage_number, name, stage_type, wave_count, recommended_level, monster_level_min, monster_level_max, exp_reward, gold_reward, star_condition_2_turns) VALUES
(1, 1, '초원 입구', 'normal', 1, 1, 1, 2, 50, 30, 5),
(1, 2, '슬라임 서식지', 'normal', 1, 2, 1, 3, 70, 40, 5),
(1, 3, '작은 숲', 'normal', 1, 3, 2, 4, 90, 50, 6),
(1, 4, '불타는 평원', 'normal', 1, 4, 3, 5, 110, 60, 6),
(1, 5, '슬라임 무리', 'wave', 3, 5, 3, 5, 150, 80, 8),
(1, 6, '강가', 'normal', 1, 6, 4, 6, 130, 70, 6),
(1, 7, '바람의 언덕', 'normal', 1, 7, 5, 7, 150, 80, 7),
(1, 8, '돌 계곡', 'normal', 1, 8, 6, 8, 170, 90, 7),
(1, 9, '어둠의 숲', 'normal', 1, 9, 7, 9, 190, 100, 8),
(1, 10, '슬라임 왕의 동굴', 'boss', 1, 10, 10, 10, 300, 200, 10);

-- Set unlock conditions
UPDATE stage_templates SET unlock_stage_id = 1 WHERE stage_number = 2;
UPDATE stage_templates SET unlock_stage_id = 2 WHERE stage_number = 3;
UPDATE stage_templates SET unlock_stage_id = 3 WHERE stage_number = 4;
UPDATE stage_templates SET unlock_stage_id = 4 WHERE stage_number = 5;
UPDATE stage_templates SET unlock_stage_id = 5 WHERE stage_number = 6;
UPDATE stage_templates SET unlock_stage_id = 6 WHERE stage_number = 7;
UPDATE stage_templates SET unlock_stage_id = 7 WHERE stage_number = 8;
UPDATE stage_templates SET unlock_stage_id = 8 WHERE stage_number = 9;
UPDATE stage_templates SET unlock_stage_id = 9 WHERE stage_number = 10;

-- =============================================
-- STAGE MONSTERS
-- =============================================

-- Stage 1: 초원 입구
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(1, 1, 1, 1, 2);

-- Stage 2: 슬라임 서식지
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(2, 1, 1, 2, 3);

-- Stage 3: 작은 숲
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(3, 1, 1, 1, 2),
(3, 4, 1, 1, 2);

-- Stage 4: 불타는 평원
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(4, 2, 1, 2, 3);

-- Stage 5: 슬라임 무리 (3 waves)
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(5, 1, 1, 2, 3),
(5, 1, 2, 2, 3),
(5, 1, 3, 3, 4);

-- Stage 6: 강가
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(6, 3, 1, 2, 3);

-- Stage 7: 바람의 언덕
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(7, 4, 1, 2, 3);

-- Stage 8: 돌 계곡
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(8, 5, 1, 1, 2);

-- Stage 9: 어둠의 숲
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max) VALUES
(9, 1, 1, 1, 1),
(9, 2, 1, 1, 1),
(9, 3, 1, 1, 1),
(9, 4, 1, 1, 1);

-- Stage 10: Boss
INSERT INTO stage_monsters (stage_id, monster_id, wave_number, spawn_count_min, spawn_count_max, is_boss) VALUES
(10, 10, 1, 1, 1, TRUE);

-- =============================================
-- CONSUMABLES
-- =============================================

INSERT INTO consumable_templates (name, description, effect_type, effect_value, buy_price, sell_price) VALUES
('상처약(소)', 'HP 50 회복', 'heal_hp', 50, 50, 25),
('상처약(중)', 'HP 150 회복', 'heal_hp', 150, 150, 75),
('상처약(대)', 'HP 300 회복', 'heal_hp', 300, 300, 150),
('기력약(소)', 'MP 30 회복', 'heal_mp', 30, 50, 25),
('기력약(중)', 'MP 80 회복', 'heal_mp', 80, 150, 75),
('기력약(대)', 'MP 150 회복', 'heal_mp', 150, 300, 150),
('해독제', '독 상태 해제', 'cure_status', NULL, 100, 50),
('각성제', '석화 상태 해제', 'cure_status', NULL, 150, 75),
('포획용 돌', '펫 포획 시도', 'capture', 10, 100, 50),
('고급 포획용 돌', '펫 포획 +20%', 'capture', 30, 300, 150);

UPDATE consumable_templates SET cure_status = 'poison' WHERE name = '해독제';
UPDATE consumable_templates SET cure_status = 'petrify' WHERE name = '각성제';

-- =============================================
-- MATERIALS
-- =============================================

INSERT INTO material_templates (name, description, grade, material_type, sell_price) VALUES
('낡은 철 조각', '무기 제작 재료', 1, 'weapon', 10),
('단단한 철 조각', '무기 제작 재료', 2, 'weapon', 30),
('정제된 철 조각', '무기 제작 재료', 3, 'weapon', 100),
('낡은 가죽', '방어구 제작 재료', 1, 'armor', 10),
('단단한 가죽', '방어구 제작 재료', 2, 'armor', 30),
('정제된 가죽', '방어구 제작 재료', 3, 'armor', 100),
('작은 뼛조각', '투구 제작 재료', 1, 'helmet', 10),
('중간 뼛조각', '투구 제작 재료', 2, 'helmet', 30),
('큰 뼛조각', '투구 제작 재료', 3, 'helmet', 100),
('흙 조각', '주술 재료', 1, 'spell', 15),
('바람 결정', '주술 재료', 1, 'spell', 15),
('불 조각', '주술 재료', 1, 'spell', 15),
('물 결정', '주술 재료', 1, 'spell', 15);

-- =============================================
-- EQUIPMENT TEMPLATES
-- =============================================

INSERT INTO equipment_templates (name, slot_type, weapon_type, required_level, stat_str_min, stat_str_max, attack_ratio, accuracy, hit_count, penalty_agi, penalty_con, buy_price) VALUES
('나무 검', 'weapon', 'sword', 1, 2, 5, 150, 90, 1, -10, 0, 100),
('철 검', 'weapon', 'sword', 5, 5, 10, 150, 90, 1, -10, 0, 300),
('나무 곤봉', 'weapon', 'club', 1, 3, 6, 100, 100, 1, 0, 0, 80),
('철 곤봉', 'weapon', 'club', 5, 6, 12, 100, 100, 1, 0, 0, 250),
('돌 도끼', 'weapon', 'axe', 1, 4, 8, 200, 90, 1, -20, -20, 150),
('철 도끼', 'weapon', 'axe', 5, 8, 15, 200, 90, 1, -20, -20, 400),
('나무 창', 'weapon', 'spear', 1, 2, 4, 90, 80, 2, -20, 0, 120),
('철 창', 'weapon', 'spear', 5, 4, 8, 90, 80, 2, -20, 0, 350),
('뼈 손톱', 'weapon', 'claw', 1, 1, 3, 40, 90, 3, 0, 0, 100),
('철 손톱', 'weapon', 'claw', 5, 2, 6, 40, 90, 3, 0, 0, 300),
('나무 활', 'weapon', 'bow', 1, 2, 5, 80, 80, 1, 0, 0, 150),
('철 활', 'weapon', 'bow', 5, 5, 10, 80, 80, 1, 0, 0, 400);

INSERT INTO equipment_templates (name, slot_type, required_level, stat_con_min, stat_con_max, stat_vit_min, stat_vit_max, buy_price) VALUES
('가죽 갑옷', 'armor', 1, 2, 5, 1, 3, 150),
('철 갑옷', 'armor', 5, 5, 10, 3, 6, 400),
('가죽 투구', 'helmet', 1, 1, 3, 1, 2, 100),
('철 투구', 'helmet', 5, 3, 6, 2, 4, 300),
('가죽 팔찌', 'bracelet', 1, 1, 2, 0, 1, 80),
('철 팔찌', 'bracelet', 5, 2, 4, 1, 2, 250),
('돌 목걸이', 'necklace', 1, 0, 1, 1, 2, 80),
('보석 목걸이', 'necklace', 5, 1, 3, 2, 4, 300);

-- =============================================
-- SPELL TEMPLATES
-- =============================================

INSERT INTO spell_templates (name, description, element, effect_type, damage_ratio, mp_cost, target_type, status_chance) VALUES
('지진', '땅을 흔들어 공격', 'earth', 'damage', 150, 20, 'all_enemies', NULL),
('바람 칼날', '날카로운 바람으로 공격', 'wind', 'damage', 120, 15, 'single', NULL),
('화염구', '불덩이를 발사', 'fire', 'damage', 130, 18, 'single', NULL),
('물 창', '물을 응축해 공격', 'water', 'damage', 125, 16, 'single', NULL),
('치료', '체력을 회복', NULL, 'heal', NULL, 25, 'single', NULL),
('전체 치료', '아군 전체 체력 회복', NULL, 'heal', NULL, 50, 'all_allies', NULL),
('독 안개', '적에게 독 부여', NULL, 'status', 50, 15, 'single', 80),
('석화 시선', '적을 석화시킴', 'earth', 'status', 30, 20, 'single', 70);

UPDATE spell_templates SET heal_ratio = 100 WHERE name = '치료';
UPDATE spell_templates SET heal_ratio = 60 WHERE name = '전체 치료';
UPDATE spell_templates SET status_effect = 'poison' WHERE name = '독 안개';
UPDATE spell_templates SET status_effect = 'petrify' WHERE name = '석화 시선';

-- =============================================
-- SHOP ITEMS
-- =============================================

INSERT INTO shop_items (consumable_id, price, display_order) VALUES
(1, 50, 1),  -- 상처약(소)
(2, 150, 2), -- 상처약(중)
(4, 50, 3),  -- 기력약(소)
(5, 150, 4), -- 기력약(중)
(7, 100, 5), -- 해독제
(8, 150, 6), -- 각성제
(9, 100, 7), -- 포획용 돌
(10, 300, 8); -- 고급 포획용 돌

INSERT INTO shop_items (equipment_id, price, display_order) VALUES
(1, 100, 10),  -- 나무 검
(3, 80, 11),   -- 나무 곤봉
(5, 150, 12),  -- 돌 도끼
(7, 120, 13),  -- 나무 창
(9, 100, 14),  -- 뼈 손톱
(11, 150, 15), -- 나무 활
(13, 150, 20), -- 가죽 갑옷
(15, 100, 21), -- 가죽 투구
(17, 80, 22),  -- 가죽 팔찌
(19, 80, 23);  -- 돌 목걸이

-- =============================================
-- DAILY DUNGEONS (7 days)
-- =============================================

INSERT INTO daily_dungeon_templates (day_of_week, dungeon_level, name, material_type, recommended_level, monster_level, exp_reward, gold_reward) VALUES
-- Sunday (0) - All types
(0, 1, '일요일 던전 1층', 'weapon', 5, 5, 200, 100),
(0, 2, '일요일 던전 2층', 'armor', 15, 15, 400, 200),
(0, 3, '일요일 던전 3층', 'helmet', 30, 30, 800, 400),
-- Monday (1) - Weapon
(1, 1, '무기 던전 1층', 'weapon', 5, 5, 200, 100),
(1, 2, '무기 던전 2층', 'weapon', 15, 15, 400, 200),
(1, 3, '무기 던전 3층', 'weapon', 30, 30, 800, 400),
-- Tuesday (2) - Armor
(2, 1, '방어구 던전 1층', 'armor', 5, 5, 200, 100),
(2, 2, '방어구 던전 2층', 'armor', 15, 15, 400, 200),
(2, 3, '방어구 던전 3층', 'armor', 30, 30, 800, 400),
-- Wednesday (3) - Helmet
(3, 1, '투구 던전 1층', 'helmet', 5, 5, 200, 100),
(3, 2, '투구 던전 2층', 'helmet', 15, 15, 400, 200),
(3, 3, '투구 던전 3층', 'helmet', 30, 30, 800, 400),
-- Thursday (4) - Bracelet
(4, 1, '팔찌 던전 1층', 'bracelet', 5, 5, 200, 100),
(4, 2, '팔찌 던전 2층', 'bracelet', 15, 15, 400, 200),
(4, 3, '팔찌 던전 3층', 'bracelet', 30, 30, 800, 400),
-- Friday (5) - Necklace
(5, 1, '목걸이 던전 1층', 'necklace', 5, 5, 200, 100),
(5, 2, '목걸이 던전 2층', 'necklace', 15, 15, 400, 200),
(5, 3, '목걸이 던전 3층', 'necklace', 30, 30, 800, 400),
-- Saturday (6) - Spell
(6, 1, '주술 던전 1층', 'spell', 5, 5, 200, 100),
(6, 2, '주술 던전 2층', 'spell', 15, 15, 400, 200),
(6, 3, '주술 던전 3층', 'spell', 30, 30, 800, 400);

-- =============================================
-- STAGE DROPS
-- =============================================

INSERT INTO stage_drops (stage_id, material_id, drop_rate, quantity_min, quantity_max) VALUES
(1, 1, 30.00, 1, 2),  -- 낡은 철 조각
(1, 4, 30.00, 1, 2),  -- 낡은 가죽
(2, 1, 35.00, 1, 3),
(2, 4, 35.00, 1, 3),
(3, 1, 40.00, 1, 3),
(3, 7, 30.00, 1, 2),  -- 작은 뼛조각
(4, 1, 40.00, 1, 3),
(4, 12, 20.00, 1, 1), -- 불 조각
(5, 1, 50.00, 2, 4),
(5, 4, 50.00, 2, 4),
(6, 13, 30.00, 1, 2), -- 물 결정
(7, 11, 30.00, 1, 2), -- 바람 결정
(8, 10, 30.00, 1, 2), -- 흙 조각
(9, 2, 20.00, 1, 2),  -- 단단한 철 조각
(9, 5, 20.00, 1, 2),  -- 단단한 가죽
(10, 2, 40.00, 2, 4),
(10, 5, 40.00, 2, 4),
(10, 8, 30.00, 1, 2); -- 중간 뼛조각

-- Consumable drops
INSERT INTO stage_drops (stage_id, consumable_id, drop_rate, quantity_min, quantity_max) VALUES
(3, 1, 10.00, 1, 1),  -- 상처약(소)
(5, 1, 15.00, 1, 2),
(7, 4, 10.00, 1, 1),  -- 기력약(소)
(10, 2, 20.00, 1, 1); -- 상처약(중)
