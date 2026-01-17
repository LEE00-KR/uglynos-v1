-- Uglynos Full Database Schema
-- 4스탯 시스템: HP, ATK, DEF, SPD
-- 통합 버전

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 유저 및 캐릭터
-- =====================================================

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

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(8) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 1000,

    -- 외형 (랜덤 생성)
    appearance_eye INTEGER NOT NULL DEFAULT 1,
    appearance_nose INTEGER NOT NULL DEFAULT 1,
    appearance_mouth INTEGER NOT NULL DEFAULT 1,
    appearance_hair INTEGER NOT NULL DEFAULT 1,
    appearance_skin INTEGER NOT NULL DEFAULT 1,

    -- 속성
    element_primary VARCHAR(10) NOT NULL DEFAULT 'earth',
    element_secondary VARCHAR(10),
    element_primary_ratio INTEGER DEFAULT 100,

    -- 4스탯 시스템
    stat_hp INTEGER DEFAULT 100,
    stat_atk INTEGER DEFAULT 10,
    stat_def INTEGER DEFAULT 10,
    stat_spd INTEGER DEFAULT 10,
    stat_points INTEGER DEFAULT 20,

    -- 현재 상태 (전투 후 유지, 자동 회복 없음)
    current_hp INTEGER,
    current_energy INTEGER DEFAULT 100,  -- 기력 (고정 100, 레벨업 시 증가 없음)

    -- 탑승 페트
    riding_pet_id UUID,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_nickname ON characters(nickname);

-- =====================================================
-- 2. 어드민 - 스킬 관리
-- =====================================================

CREATE TABLE admin_skills (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cost INTEGER NOT NULL DEFAULT 0,
    components JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. 어드민 - 페트 관리 (4스탯)
-- =====================================================

CREATE TABLE admin_pets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    element_primary VARCHAR(20) NOT NULL,
    element_secondary VARCHAR(20),
    element_primary_ratio INTEGER DEFAULT 100,

    -- 기본 스탯 범위
    base_hp_min INTEGER NOT NULL DEFAULT 80,
    base_hp_max INTEGER NOT NULL DEFAULT 120,
    base_atk_min INTEGER NOT NULL DEFAULT 8,
    base_atk_max INTEGER NOT NULL DEFAULT 12,
    base_def_min INTEGER NOT NULL DEFAULT 8,
    base_def_max INTEGER NOT NULL DEFAULT 12,
    base_spd_min INTEGER NOT NULL DEFAULT 8,
    base_spd_max INTEGER NOT NULL DEFAULT 12,

    -- 보너스 풀
    bonus_hp INTEGER NOT NULL DEFAULT 10,
    bonus_atk INTEGER NOT NULL DEFAULT 2,
    bonus_def INTEGER NOT NULL DEFAULT 2,
    bonus_spd INTEGER NOT NULL DEFAULT 2,

    -- 성장률 범위
    growth_hp_min DECIMAL(4,2) NOT NULL DEFAULT 5.00,
    growth_hp_max DECIMAL(4,2) NOT NULL DEFAULT 10.00,
    growth_atk_min DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_atk_max DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    growth_def_min DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_def_max DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    growth_spd_min DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_spd_max DECIMAL(4,2) NOT NULL DEFAULT 2.00,

    -- 총합 스탯
    total_stats INTEGER NOT NULL DEFAULT 156,

    -- 스프라이트
    sprite_idle TEXT,
    sprite_attack TEXT,
    sprite_hit TEXT,
    sprite_defend TEXT,
    sprite_down TEXT,
    sprite_walk TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 페트-스킬 연결
CREATE TABLE admin_pet_skills (
    id SERIAL PRIMARY KEY,
    pet_id VARCHAR(50) REFERENCES admin_pets(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) REFERENCES admin_skills(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL,
    UNIQUE(pet_id, skill_id),
    UNIQUE(pet_id, slot)
);

-- =====================================================
-- 4. 실제 페트 인스턴스 (유저 소유)
-- =====================================================

CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    template_id VARCHAR(50) REFERENCES admin_pets(id),

    nickname VARCHAR(20),
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,

    -- 4스탯 (실제 값)
    stat_hp INTEGER NOT NULL,
    stat_atk INTEGER NOT NULL,
    stat_def INTEGER NOT NULL,
    stat_spd INTEGER NOT NULL,

    -- 성장률 (실제 값)
    growth_hp DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_atk DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_def DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_spd DECIMAL(4,2) NOT NULL DEFAULT 1.00,

    -- 성장 그룹 (S/A/B/C/D)
    growth_group VARCHAR(1) NOT NULL DEFAULT 'C',

    loyalty INTEGER DEFAULT 50,
    current_hp INTEGER,

    party_slot INTEGER CHECK (party_slot BETWEEN 1 AND 3),
    is_riding BOOLEAN DEFAULT FALSE,
    is_rare_color BOOLEAN DEFAULT FALSE,
    is_starter BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pets_character_id ON pets(character_id);
CREATE INDEX idx_pets_party_slot ON pets(character_id, party_slot);

-- 페트 보관함
CREATE TABLE pet_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 10),
    stored_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(character_id, slot)
);

-- characters에 riding_pet 외래키 추가
ALTER TABLE characters ADD CONSTRAINT fk_riding_pet
    FOREIGN KEY (riding_pet_id) REFERENCES pets(id) ON DELETE SET NULL;

-- =====================================================
-- 5. 어드민 - 스테이지 관리
-- =====================================================

CREATE TABLE admin_stage_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    background TEXT,
    stages JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_stages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    background TEXT,
    monsters JSONB DEFAULT '[]',
    wild_pets JSONB DEFAULT '[]',
    exp_reward INTEGER NOT NULL DEFAULT 100,
    gold_reward INTEGER NOT NULL DEFAULT 50,
    star_condition_2_turns INTEGER DEFAULT 0,
    star_condition_3_type VARCHAR(30) DEFAULT 'none',
    star_condition_3_value INTEGER DEFAULT 0,
    drops JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 스테이지 진행도
CREATE TABLE stage_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    stage_id VARCHAR(50) REFERENCES admin_stages(id),
    is_cleared BOOLEAN DEFAULT FALSE,
    best_stars INTEGER DEFAULT 0,
    clear_count INTEGER DEFAULT 0,
    first_clear_at TIMESTAMP,
    last_clear_at TIMESTAMP,
    UNIQUE(character_id, stage_id)
);

CREATE INDEX idx_stage_progress_character_id ON stage_progress(character_id);

-- =====================================================
-- 6. 어드민 - 상점 관리
-- =====================================================

CREATE TABLE admin_shop_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,
    shop_type VARCHAR(20) NOT NULL DEFAULT 'general',
    price INTEGER NOT NULL DEFAULT 0,
    icon TEXT,
    description TEXT,
    effect JSONB,
    stackable BOOLEAN DEFAULT TRUE,
    max_stack INTEGER DEFAULT 99,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. 인벤토리
-- =====================================================

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    item_id VARCHAR(50) REFERENCES admin_shop_items(id),
    quantity INTEGER DEFAULT 1,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 24),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(character_id, slot)
);

CREATE INDEX idx_inventory_character_id ON inventory(character_id);

-- =====================================================
-- 8. 전투 로그
-- =====================================================

CREATE TABLE battle_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    battle_type VARCHAR(20) NOT NULL,
    stage_id VARCHAR(50) REFERENCES admin_stages(id),
    result VARCHAR(10) NOT NULL,
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

-- =====================================================
-- 9. 인덱스
-- =====================================================

CREATE INDEX idx_admin_pets_name ON admin_pets(name);
CREATE INDEX idx_admin_skills_name ON admin_skills(name);
CREATE INDEX idx_admin_stage_groups_name ON admin_stage_groups(name);
CREATE INDEX idx_admin_stages_name ON admin_stages(name);
CREATE INDEX idx_admin_shop_items_category ON admin_shop_items(category);

-- =====================================================
-- 10. 트리거 (updated_at 자동 갱신)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pets_updated_at
    BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_pets_updated_at
    BEFORE UPDATE ON admin_pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_skills_updated_at
    BEFORE UPDATE ON admin_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_stages_updated_at
    BEFORE UPDATE ON admin_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_admin_shop_items_updated_at
    BEFORE UPDATE ON admin_shop_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
