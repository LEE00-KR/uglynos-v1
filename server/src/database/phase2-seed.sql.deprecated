-- Phase 2: 초기 데이터

-- =============================================
-- 아이템 템플릿
-- =============================================

-- 무기
INSERT INTO item_templates (name, description, type, subtype, rarity, level_required, stat_str, stat_agi, buy_price, sell_price, icon_url) VALUES
('나무 몽둥이', '초보자용 기본 무기', 'weapon', 'club', 'common', 1, 3, 0, 100, 25, '/items/wooden_club.png'),
('돌 도끼', '돌로 만든 도끼', 'weapon', 'axe', 'common', 3, 6, 1, 300, 75, '/items/stone_axe.png'),
('뼈 창', '동물 뼈로 만든 창', 'weapon', 'spear', 'common', 5, 8, 3, 500, 125, '/items/bone_spear.png'),
('청동 검', '청동으로 만든 검', 'weapon', 'sword', 'uncommon', 8, 12, 4, 1000, 250, '/items/bronze_sword.png'),
('화염 도끼', '불의 힘이 깃든 도끼', 'weapon', 'axe', 'rare', 12, 18, 5, 3000, 750, '/items/flame_axe.png');

-- 방어구 - 투구
INSERT INTO item_templates (name, description, type, subtype, rarity, level_required, stat_vit, stat_con, buy_price, sell_price, icon_url) VALUES
('가죽 모자', '가죽으로 만든 모자', 'armor', 'helmet', 'common', 1, 1, 1, 80, 20, '/items/leather_hat.png'),
('뼈 투구', '동물 뼈로 만든 투구', 'armor', 'helmet', 'common', 5, 3, 2, 400, 100, '/items/bone_helmet.png'),
('청동 투구', '청동으로 만든 투구', 'armor', 'helmet', 'uncommon', 10, 5, 4, 1200, 300, '/items/bronze_helmet.png');

-- 방어구 - 갑옷
INSERT INTO item_templates (name, description, type, subtype, rarity, level_required, stat_vit, stat_con, buy_price, sell_price, icon_url) VALUES
('가죽 조끼', '가죽으로 만든 조끼', 'armor', 'chest', 'common', 1, 2, 2, 120, 30, '/items/leather_vest.png'),
('뼈 갑옷', '동물 뼈로 만든 갑옷', 'armor', 'chest', 'common', 5, 5, 4, 600, 150, '/items/bone_armor.png'),
('청동 갑옷', '청동으로 만든 갑옷', 'armor', 'chest', 'uncommon', 10, 8, 6, 1800, 450, '/items/bronze_armor.png');

-- 악세서리
INSERT INTO item_templates (name, description, type, subtype, rarity, level_required, stat_str, stat_agi, stat_int, buy_price, sell_price, icon_url) VALUES
('조개 목걸이', '조개로 만든 목걸이', 'accessory', 'necklace', 'common', 1, 0, 1, 1, 150, 37, '/items/shell_necklace.png'),
('늑대 이빨 목걸이', '늑대 이빨로 만든 목걸이', 'accessory', 'necklace', 'uncommon', 5, 2, 2, 0, 500, 125, '/items/wolf_tooth_necklace.png'),
('힘의 반지', 'STR을 올려주는 반지', 'accessory', 'ring', 'uncommon', 8, 5, 0, 0, 800, 200, '/items/power_ring.png');

-- 소모품 - 물약
INSERT INTO item_templates (name, description, type, subtype, rarity, effect_type, effect_value, buy_price, sell_price, stackable, max_stack, icon_url) VALUES
('작은 체력 포션', 'HP 50 회복', 'consumable', 'potion', 'common', 'heal_hp', 50, 30, 7, true, 99, '/items/hp_potion_s.png'),
('체력 포션', 'HP 150 회복', 'consumable', 'potion', 'common', 'heal_hp', 150, 80, 20, true, 99, '/items/hp_potion_m.png'),
('큰 체력 포션', 'HP 300 회복', 'consumable', 'potion', 'uncommon', 'heal_hp', 300, 200, 50, true, 99, '/items/hp_potion_l.png'),
('작은 마나 포션', 'MP 30 회복', 'consumable', 'potion', 'common', 'heal_mp', 30, 40, 10, true, 99, '/items/mp_potion_s.png'),
('마나 포션', 'MP 80 회복', 'consumable', 'potion', 'common', 'heal_mp', 80, 100, 25, true, 99, '/items/mp_potion_m.png');

-- 소모품 - 포획 아이템
INSERT INTO item_templates (name, description, type, subtype, rarity, effect_type, capture_rate_bonus, buy_price, sell_price, stackable, max_stack, icon_url) VALUES
('낡은 덫', '기본 포획 아이템', 'capture_item', 'trap', 'common', 'capture', 0, 50, 12, true, 99, '/items/old_trap.png'),
('튼튼한 덫', '포획률 +10%', 'capture_item', 'trap', 'uncommon', 'capture', 10, 150, 37, true, 99, '/items/sturdy_trap.png'),
('고급 덫', '포획률 +25%', 'capture_item', 'trap', 'rare', 'capture', 25, 500, 125, true, 50, '/items/premium_trap.png'),
('달콤한 고기', '포획률 +5%, 미끼', 'capture_item', 'bait', 'common', 'capture', 5, 30, 7, true, 99, '/items/sweet_meat.png');

-- 재료
INSERT INTO item_templates (name, description, type, subtype, rarity, buy_price, sell_price, stackable, max_stack, icon_url) VALUES
('공룡 가죽', '공룡에게서 얻은 가죽', 'material', 'leather', 'common', 0, 15, true, 99, '/items/dino_leather.png'),
('늑대 가죽', '늑대에게서 얻은 가죽', 'material', 'leather', 'common', 0, 25, true, 99, '/items/wolf_leather.png'),
('박쥐 날개', '박쥐에게서 얻은 날개', 'material', 'wing', 'common', 0, 20, true, 99, '/items/bat_wing.png'),
('작은 뼈', '작은 동물의 뼈', 'material', 'bone', 'common', 0, 10, true, 99, '/items/small_bone.png'),
('튼튼한 뼈', '큰 동물의 뼈', 'material', 'bone', 'uncommon', 0, 35, true, 99, '/items/strong_bone.png'),
('구리 광석', '제련에 사용되는 광석', 'material', 'ore', 'common', 0, 20, true, 99, '/items/copper_ore.png'),
('주석 광석', '청동 제작에 필요', 'material', 'ore', 'common', 0, 25, true, 99, '/items/tin_ore.png');

-- =============================================
-- 상점
-- =============================================
INSERT INTO shops (name, description, npc_name, shop_type, icon_url) VALUES
('잡화점', '기본 물품을 판매하는 상점', '상인 톰', 'general', '/shops/general.png'),
('무기점', '무기를 판매하는 상점', '대장장이 막스', 'weapon', '/shops/weapon.png'),
('방어구점', '방어구를 판매하는 상점', '재봉사 린다', 'armor', '/shops/armor.png'),
('약초점', '물약과 소모품을 판매하는 상점', '약초사 미라', 'potion', '/shops/potion.png');

-- =============================================
-- 상점 아이템
-- =============================================

-- 잡화점 (포획 아이템 + 기본 물약)
INSERT INTO shop_items (shop_id, item_template_id, stock, level_required) VALUES
(1, 15, -1, 1),  -- 작은 체력 포션
(1, 18, -1, 1),  -- 작은 마나 포션
(1, 20, -1, 1),  -- 낡은 덫
(1, 21, -1, 5),  -- 튼튼한 덫
(1, 23, -1, 1);  -- 달콤한 고기

-- 무기점
INSERT INTO shop_items (shop_id, item_template_id, stock, level_required) VALUES
(2, 1, -1, 1),   -- 나무 몽둥이
(2, 2, -1, 3),   -- 돌 도끼
(2, 3, -1, 5),   -- 뼈 창
(2, 4, -1, 8),   -- 청동 검
(2, 5, 3, 12);   -- 화염 도끼 (한정 3개)

-- 방어구점
INSERT INTO shop_items (shop_id, item_template_id, stock, level_required) VALUES
(3, 6, -1, 1),   -- 가죽 모자
(3, 7, -1, 5),   -- 뼈 투구
(3, 8, -1, 10),  -- 청동 투구
(3, 9, -1, 1),   -- 가죽 조끼
(3, 10, -1, 5),  -- 뼈 갑옷
(3, 11, -1, 10), -- 청동 갑옷
(3, 12, -1, 1),  -- 조개 목걸이
(3, 13, -1, 5),  -- 늑대 이빨 목걸이
(3, 14, -1, 8);  -- 힘의 반지

-- 약초점
INSERT INTO shop_items (shop_id, item_template_id, stock, level_required) VALUES
(4, 15, -1, 1),  -- 작은 체력 포션
(4, 16, -1, 5),  -- 체력 포션
(4, 17, -1, 10), -- 큰 체력 포션
(4, 18, -1, 1),  -- 작은 마나 포션
(4, 19, -1, 5);  -- 마나 포션

-- =============================================
-- NPC
-- =============================================
INSERT INTO npcs (name, title, dialogue, location, shop_id, position_x, position_y) VALUES
('톰', '상인', ARRAY['어서오세요!', '필요한 물건이 있으신가요?', '좋은 물건 많아요~'], 'village', 1, 200, 300),
('막스', '대장장이', ARRAY['최고의 무기를 만들어드리죠!', '이 검은 내가 직접 만든 거야.', '강한 무기가 필요하다면 여기로!'], 'village', 2, 400, 300),
('린다', '재봉사', ARRAY['방어구를 찾으시나요?', '튼튼한 갑옷이 있어요.', '가죽 세공은 제 전문이에요.'], 'village', 3, 600, 300),
('미라', '약초사', ARRAY['물약이 필요하신가요?', '이 약초는 상처에 좋아요.', '전투 전에 물약을 챙기세요!'], 'village', 4, 300, 450),
('촌장 그렉', '촌장', ARRAY['우리 마을에 오신 것을 환영합니다!', '이곳은 평화로운 마을이에요.', '모험가님, 마을을 지켜주세요.'], 'village', NULL, 500, 200);

-- =============================================
-- 제작 레시피
-- =============================================
INSERT INTO recipes (name, result_item_id, result_quantity, gold_cost, level_required, success_rate) VALUES
('돌 도끼 제작', 2, 1, 100, 3, 100),
('뼈 창 제작', 3, 1, 200, 5, 95),
('청동 검 제작', 4, 1, 500, 8, 90),
('뼈 투구 제작', 7, 1, 150, 5, 95),
('뼈 갑옷 제작', 10, 1, 250, 5, 95),
('체력 포션 제작', 16, 3, 50, 3, 100);

-- =============================================
-- 제작 재료
-- =============================================
INSERT INTO recipe_materials (recipe_id, item_template_id, quantity) VALUES
-- 돌 도끼: 작은 뼈 2개
(1, 27, 2),
-- 뼈 창: 튼튼한 뼈 1개, 작은 뼈 3개
(2, 28, 1),
(2, 27, 3),
-- 청동 검: 구리 광석 3개, 주석 광석 2개
(3, 29, 3),
(3, 30, 2),
-- 뼈 투구: 튼튼한 뼈 2개, 공룡 가죽 1개
(4, 28, 2),
(4, 24, 1),
-- 뼈 갑옷: 튼튼한 뼈 3개, 공룡 가죽 2개
(5, 28, 3),
(5, 24, 2);
