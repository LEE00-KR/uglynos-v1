# 🗄️ 데이터베이스 스키마 (MVP)

> **최종 수정일:** 2026-01-13  
> **버전:** v1.1

Prehistoric Life MVP용 데이터베이스 설계입니다.

**기술 스택:** Supabase (PostgreSQL)

---

## 📊 테이블 개요

| 그룹 | 테이블 | 설명 |
|------|--------|------|
| **계정** | users | 계정 정보 |
| | characters | 캐릭터 정보 |
| **펫** | pet_templates | 펫 종류 정의 |
| | pets | 보유 펫 |
| | pet_storage | 펫 보관소 |
| | pet_skills | 펫 스킬 정의 |
| **장비** | equipment_templates | 장비 종류 정의 |
| | equipment | 보유 장비 |
| | spell_templates | 주술 정의 |
| **인벤토리** | inventory_consumables | 소모품 |
| | inventory_materials | 재료 |
| | consumable_templates | 소모품 정의 |
| | material_templates | 재료 정의 |
| **스테이지** | stage_templates | 스테이지 정의 |
| | stage_monsters | 스테이지별 몬스터 |
| | stage_drops | 드랍 테이블 |
| | stage_progress | 진행 상황 |
| | monster_templates | 몬스터 정의 |
| **요일 던전** | daily_dungeon_templates | 던전 정의 |
| | daily_dungeon_progress | 진행 상황 |
| **제작** | recipes | 제작 레시피 |
| | recipe_materials | 레시피 재료 |
| **상점** | shop_items | 상점 아이템 |
| **로그** | battle_logs | 전투 결과 |
| **멀티** | party_sessions | 파티 세션 |
| | party_members | 파티 멤버 |

---

## 1. 계정 시스템

### 1.1 users (계정)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT
);
```

### 1.2 characters (캐릭터)

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- 기본 정보
  nickname VARCHAR(8) UNIQUE NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  
  -- 외형 (랜덤 생성)
  appearance_eye INTEGER NOT NULL,
  appearance_nose INTEGER NOT NULL,
  appearance_mouth INTEGER NOT NULL,
  appearance_hair INTEGER NOT NULL,
  appearance_skin INTEGER NOT NULL,
  
  -- 속성 (복합 가능)
  element_primary VARCHAR(10) NOT NULL,      -- earth, wind, fire, water
  element_secondary VARCHAR(10),              -- NULL이면 단일 속성
  element_primary_ratio INTEGER DEFAULT 100,  -- 복합 시 비율 (%)
  
  -- 기본 스탯 (초기 각 5 + 20포인트)
  stat_str INTEGER DEFAULT 5,
  stat_agi INTEGER DEFAULT 5,
  stat_vit INTEGER DEFAULT 5,
  stat_con INTEGER DEFAULT 5,
  stat_int INTEGER DEFAULT 5,
  stat_points INTEGER DEFAULT 20,  -- 미배분 포인트
  
  -- 현재 상태
  current_hp INTEGER,
  current_mp INTEGER,
  
  -- 탑승 펫
  riding_pet_id UUID,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_nickname ON characters(nickname);
```

---

## 2. 펫 시스템

### 2.1 pet_templates (펫 종류 정의)

```sql
CREATE TABLE pet_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  size VARCHAR(1) NOT NULL,  -- S, M, L
  
  -- 속성
  element_primary VARCHAR(10) NOT NULL,
  element_secondary VARCHAR(10),
  element_primary_ratio INTEGER DEFAULT 100,
  
  -- 기본 스탯
  base_str INTEGER NOT NULL,
  base_agi INTEGER NOT NULL,
  base_vit INTEGER NOT NULL,
  base_con INTEGER NOT NULL,
  base_int INTEGER NOT NULL,
  
  -- 스킬
  skill_1_id INTEGER REFERENCES pet_skills(id),
  skill_2_id INTEGER REFERENCES pet_skills(id),
  
  -- 출현 정보
  capturable BOOLEAN DEFAULT TRUE,
  spawn_stage_min INTEGER,
  spawn_stage_max INTEGER,
  
  -- 에셋
  sprite_sheet VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 pets (보유 펫)

```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES pet_templates(id),
  
  -- 기본 정보
  nickname VARCHAR(20),
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  
  -- 개체 스탯 (랜덤 생성)
  stat_str INTEGER NOT NULL,
  stat_agi INTEGER NOT NULL,
  stat_vit INTEGER NOT NULL,
  stat_con INTEGER NOT NULL,
  stat_int INTEGER NOT NULL,
  
  -- 성장률 (랜덤, %)
  growth_str INTEGER NOT NULL,
  growth_agi INTEGER NOT NULL,
  growth_vit INTEGER NOT NULL,
  growth_con INTEGER NOT NULL,
  growth_int INTEGER NOT NULL,
  
  -- 충성도
  loyalty INTEGER DEFAULT 50,
  
  -- 현재 상태
  current_hp INTEGER,
  current_mp INTEGER,
  
  -- 파티 슬롯 (1~3, NULL이면 파티에 없음)
  party_slot INTEGER CHECK (party_slot BETWEEN 1 AND 3),
  
  -- 희귀 컬러 / 스타터
  is_rare_color BOOLEAN DEFAULT FALSE,
  is_starter BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pets_character_id ON pets(character_id);
CREATE INDEX idx_pets_party_slot ON pets(character_id, party_slot);
```

### 2.3 pet_storage (펫 보관소)

```sql
CREATE TABLE pet_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 10),
  stored_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, slot)
);

CREATE INDEX idx_pet_storage_character_id ON pet_storage(character_id);
```

### 2.4 pet_skills (펫 스킬 정의)

```sql
CREATE TABLE pet_skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  element VARCHAR(10),  -- NULL이면 펫 속성 따라감
  
  -- 효과
  damage_ratio INTEGER,          -- 공격력 대비 %
  effect_type VARCHAR(20),       -- damage, heal, buff, debuff, status
  status_effect VARCHAR(20),     -- poison, petrify, confusion 등
  
  -- MP 소모
  mp_cost INTEGER DEFAULT 0,
  
  -- 대상
  target_type VARCHAR(20) NOT NULL,  -- single, all_enemies, all_allies, self
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 3. 장비 시스템

### 3.1 equipment_templates (장비 종류 정의)

```sql
CREATE TABLE equipment_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  slot_type VARCHAR(20) NOT NULL,  -- weapon, armor, helmet, bracelet, necklace
  weapon_type VARCHAR(20),         -- sword, club, axe, spear, claw, bow (무기만)
  
  -- 착용 레벨
  required_level INTEGER DEFAULT 1,
  
  -- 기본 스탯 범위 (랜덤 생성용)
  stat_str_min INTEGER DEFAULT 0, stat_str_max INTEGER DEFAULT 0,
  stat_agi_min INTEGER DEFAULT 0, stat_agi_max INTEGER DEFAULT 0,
  stat_vit_min INTEGER DEFAULT 0, stat_vit_max INTEGER DEFAULT 0,
  stat_con_min INTEGER DEFAULT 0, stat_con_max INTEGER DEFAULT 0,
  stat_int_min INTEGER DEFAULT 0, stat_int_max INTEGER DEFAULT 0,
  
  -- 무기 전용 스탯
  attack_ratio INTEGER DEFAULT 100,  -- 공격력 배율 (%)
  accuracy INTEGER DEFAULT 100,      -- 명중률 (%)
  hit_count INTEGER DEFAULT 1,       -- 타격 횟수
  penalty_agi INTEGER DEFAULT 0,     -- 민첩 패널티
  penalty_con INTEGER DEFAULT 0,     -- 방어 패널티
  
  -- 에셋/상점
  icon VARCHAR(255),
  buy_price INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 spell_templates (주술 정의)

```sql
CREATE TABLE spell_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  element VARCHAR(10),  -- earth, wind, fire, water, NULL(무속성)
  
  -- 효과
  effect_type VARCHAR(20) NOT NULL,  -- damage, heal, buff, debuff, status
  damage_ratio INTEGER,
  heal_ratio INTEGER,
  buff_type VARCHAR(20),
  buff_value INTEGER,
  buff_duration INTEGER,
  status_effect VARCHAR(20),
  
  -- MP 소모
  mp_cost INTEGER NOT NULL,
  
  -- 대상
  target_type VARCHAR(20) NOT NULL,
  status_chance INTEGER DEFAULT 90,  -- 상태이상 적용 확률
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 equipment (보유 장비)

```sql
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES equipment_templates(id),
  
  -- 실제 스탯 (랜덤 생성된 값)
  stat_str INTEGER DEFAULT 0,
  stat_agi INTEGER DEFAULT 0,
  stat_vit INTEGER DEFAULT 0,
  stat_con INTEGER DEFAULT 0,
  stat_int INTEGER DEFAULT 0,
  
  -- 부착된 주술
  spell_id INTEGER REFERENCES spell_templates(id),
  
  -- 내구도
  durability INTEGER DEFAULT 100,
  max_durability INTEGER DEFAULT 100,
  
  -- 장착 여부
  is_equipped BOOLEAN DEFAULT FALSE,
  inventory_slot INTEGER CHECK (inventory_slot BETWEEN 1 AND 24),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_character_id ON equipment(character_id);
CREATE INDEX idx_equipment_is_equipped ON equipment(character_id, is_equipped);
```

---

## 4. 인벤토리 시스템

### 4.1 consumable_templates (소모품 정의)

```sql
CREATE TABLE consumable_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  effect_type VARCHAR(20) NOT NULL,  -- heal_hp, heal_mp, cure_status, capture
  effect_value INTEGER,
  cure_status VARCHAR(20),
  buy_price INTEGER,
  sell_price INTEGER,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 inventory_consumables (소모품 인벤토리)

```sql
CREATE TABLE inventory_consumables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES consumable_templates(id),
  quantity INTEGER DEFAULT 1,
  inventory_slot INTEGER NOT NULL CHECK (inventory_slot BETWEEN 1 AND 24),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, inventory_slot)
);

CREATE INDEX idx_inventory_consumables_character_id ON inventory_consumables(character_id);
```

### 4.3 material_templates (재료 정의)

```sql
CREATE TABLE material_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  grade INTEGER NOT NULL DEFAULT 1,        -- 재료 등급 (1, 2, 3...)
  material_type VARCHAR(20) NOT NULL,      -- weapon, armor, helmet, bracelet, necklace, spell
  sell_price INTEGER,
  icon VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.4 inventory_materials (재료 인벤토리)

```sql
CREATE TABLE inventory_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES material_templates(id),
  quantity INTEGER DEFAULT 1,
  inventory_slot INTEGER NOT NULL CHECK (inventory_slot BETWEEN 1 AND 24),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, inventory_slot)
);

CREATE INDEX idx_inventory_materials_character_id ON inventory_materials(character_id);
```

---

## 5. 스테이지 시스템

### 5.1 stage_templates (스테이지 정의)

```sql
CREATE TABLE stage_templates (
  id SERIAL PRIMARY KEY,
  chapter INTEGER NOT NULL,
  stage_number INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- 스테이지 유형
  stage_type VARCHAR(20) NOT NULL,  -- normal, wave, boss
  wave_count INTEGER DEFAULT 1,
  
  -- 난이도
  recommended_level INTEGER NOT NULL,
  monster_level_min INTEGER NOT NULL,
  monster_level_max INTEGER NOT NULL,
  
  -- 별점 조건
  star_condition_2_turns INTEGER DEFAULT 10,
  star_condition_3_type VARCHAR(50),
  star_condition_3_value VARCHAR(100),
  
  -- 보상
  exp_reward INTEGER NOT NULL,
  gold_reward INTEGER NOT NULL,
  
  -- 해금 조건
  unlock_stage_id INTEGER REFERENCES stage_templates(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chapter, stage_number)
);

CREATE INDEX idx_stage_templates_chapter ON stage_templates(chapter, stage_number);
```

### 5.2 stage_monsters (스테이지별 몬스터 배치)

```sql
CREATE TABLE stage_monsters (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER REFERENCES stage_templates(id) ON DELETE CASCADE,
  monster_id INTEGER REFERENCES monster_templates(id),
  wave_number INTEGER DEFAULT 1,
  spawn_count_min INTEGER DEFAULT 1,
  spawn_count_max INTEGER DEFAULT 1,
  is_boss BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stage_monsters_stage_id ON stage_monsters(stage_id);
```

### 5.3 stage_drops (스테이지 드랍 테이블)

```sql
CREATE TABLE stage_drops (
  id SERIAL PRIMARY KEY,
  stage_id INTEGER REFERENCES stage_templates(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES material_templates(id),
  equipment_id INTEGER REFERENCES equipment_templates(id),
  consumable_id INTEGER REFERENCES consumable_templates(id),
  drop_rate DECIMAL(5,2) NOT NULL,
  quantity_min INTEGER DEFAULT 1,
  quantity_max INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stage_drops_stage_id ON stage_drops(stage_id);
```

### 5.4 stage_progress (스테이지 진행 상황)

```sql
CREATE TABLE stage_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  stage_id INTEGER REFERENCES stage_templates(id),
  is_cleared BOOLEAN DEFAULT FALSE,
  best_stars INTEGER DEFAULT 0,
  clear_count INTEGER DEFAULT 0,
  first_clear_at TIMESTAMP,
  last_clear_at TIMESTAMP,
  UNIQUE(character_id, stage_id)
);

CREATE INDEX idx_stage_progress_character_id ON stage_progress(character_id);
```

### 5.5 monster_templates (몬스터 정의)

```sql
CREATE TABLE monster_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- 속성
  element_primary VARCHAR(10) NOT NULL,
  element_secondary VARCHAR(10),
  element_primary_ratio INTEGER DEFAULT 100,
  
  -- 기본 스탯 (레벨 1 기준)
  base_hp INTEGER NOT NULL,
  base_mp INTEGER NOT NULL,
  base_str INTEGER NOT NULL,
  base_agi INTEGER NOT NULL,
  base_con INTEGER NOT NULL,
  
  -- 레벨당 스탯 증가
  growth_hp INTEGER DEFAULT 10,
  growth_mp INTEGER DEFAULT 5,
  growth_str INTEGER DEFAULT 2,
  growth_agi INTEGER DEFAULT 2,
  growth_con INTEGER DEFAULT 2,
  
  -- 경험치
  base_exp INTEGER NOT NULL,
  is_boss BOOLEAN DEFAULT FALSE,
  
  -- 포획 가능 펫 연결
  linked_pet_id INTEGER REFERENCES pet_templates(id),
  sprite_sheet VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. 요일 던전

### 6.1 daily_dungeon_templates (요일 던전 정의)

```sql
CREATE TABLE daily_dungeon_templates (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=일, 6=토
  dungeon_level INTEGER NOT NULL,
  name VARCHAR(50) NOT NULL,
  material_type VARCHAR(20) NOT NULL,  -- weapon, armor, helmet, bracelet, necklace, spell
  recommended_level INTEGER NOT NULL,
  monster_level INTEGER NOT NULL,
  exp_reward INTEGER NOT NULL,
  gold_reward INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day_of_week, dungeon_level)
);
```

### 6.2 daily_dungeon_progress (요일 던전 진행)

```sql
CREATE TABLE daily_dungeon_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  dungeon_id INTEGER REFERENCES daily_dungeon_templates(id),
  is_unlocked BOOLEAN DEFAULT FALSE,
  clear_count INTEGER DEFAULT 0,
  last_clear_at TIMESTAMP,
  UNIQUE(character_id, dungeon_id)
);

CREATE INDEX idx_daily_dungeon_progress_character_id ON daily_dungeon_progress(character_id);
```

---

## 7. 제작 시스템

### 7.1 recipes (제작 레시피)

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  result_equipment_id INTEGER REFERENCES equipment_templates(id),
  gold_cost INTEGER NOT NULL,
  required_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 recipe_materials (레시피 재료)

```sql
CREATE TABLE recipe_materials (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES material_templates(id),
  quantity INTEGER NOT NULL,
  is_spell_material BOOLEAN DEFAULT FALSE,
  result_spell_id INTEGER REFERENCES spell_templates(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipe_materials_recipe_id ON recipe_materials(recipe_id);
```

---

## 8. 상점/로그/멀티

### 8.1 shop_items (상점 아이템)

```sql
CREATE TABLE shop_items (
  id SERIAL PRIMARY KEY,
  consumable_id INTEGER REFERENCES consumable_templates(id),
  equipment_id INTEGER REFERENCES equipment_templates(id),
  price INTEGER NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.2 battle_logs (전투 결과)

```sql
CREATE TABLE battle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  battle_type VARCHAR(20) NOT NULL,  -- stage, daily_dungeon
  stage_id INTEGER REFERENCES stage_templates(id),
  daily_dungeon_id INTEGER REFERENCES daily_dungeon_templates(id),
  result VARCHAR(10) NOT NULL,       -- win, lose, flee
  turns_taken INTEGER,
  stars_earned INTEGER DEFAULT 0,
  exp_earned INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0,
  party_composition JSONB,
  drops JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE INDEX idx_battle_logs_character_id ON battle_logs(character_id);
CREATE INDEX idx_battle_logs_started_at ON battle_logs(started_at);
```

### 8.3 party_sessions / party_members (파티)

```sql
CREATE TABLE party_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID REFERENCES characters(id),
  status VARCHAR(20) DEFAULT 'waiting',  -- waiting, in_battle, completed
  stage_id INTEGER REFERENCES stage_templates(id),
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES party_sessions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id),
  is_ready BOOLEAN DEFAULT FALSE,
  join_order INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, character_id)
);

CREATE INDEX idx_party_members_session_id ON party_members(session_id);
CREATE INDEX idx_party_members_character_id ON party_members(character_id);
```

---

## 📊 ERD 요약

```
users (1) ─── (1) characters
                    │
                    ├── (N) pets ─── pet_storage
                    ├── (N) equipment
                    ├── (N) inventory_consumables
                    ├── (N) inventory_materials
                    ├── (N) stage_progress
                    ├── (N) daily_dungeon_progress
                    ├── (N) battle_logs
                    └── (N) party_members ─── party_sessions

Templates (정적 데이터):
├── pet_templates, pet_skills
├── equipment_templates, spell_templates
├── consumable_templates, material_templates
├── stage_templates, monster_templates
├── daily_dungeon_templates
├── recipes, recipe_materials
└── shop_items
```

---

## 🔧 Supabase 설정

### Row Level Security (RLS)

```sql
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own character"
  ON characters FOR ALL
  USING (user_id = auth.uid());

ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own pets"
  ON pets FOR ALL
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

-- 다른 테이블도 동일하게 적용
```

### 실시간 구독 (멀티플레이용)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE party_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE party_members;
```

---

## 📋 초기 데이터 (Seed)

### 스타터 펫

```sql
INSERT INTO pet_templates (name, size, element_primary, base_str, base_agi, base_vit, base_con, base_int)
VALUES ('아기 공룡', 'S', 'earth', 5, 5, 5, 5, 5);
```

### 기본 상점 아이템

```sql
INSERT INTO consumable_templates (name, effect_type, effect_value, buy_price, sell_price)
VALUES 
  ('상처약(소)', 'heal_hp', 50, 50, 25),
  ('상처약(중)', 'heal_hp', 150, 150, 75),
  ('상처약(대)', 'heal_hp', 300, 300, 150),
  ('기력약(소)', 'heal_mp', 30, 50, 25),
  ('기력약(중)', 'heal_mp', 80, 150, 75),
  ('기력약(대)', 'heal_mp', 150, 300, 150);
```

---

## 📋 TODO (MVP 이후)

- [ ] 퀘스트 테이블
- [ ] 업적 테이블
- [ ] 칭호 테이블
- [ ] 거래소 테이블
- [ ] 우편함 테이블
- [ ] 창고 테이블
- [ ] 길드 테이블
- [ ] 캐시샵 테이블

---

## 📝 버전 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v1.0 | 2026-01-13 | 초기 작성 |
| v1.1 | 2026-01-13 | 포맷 통일, ERD 요약 추가, 코드 압축 |
