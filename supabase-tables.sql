-- 1. 스킬 테이블
CREATE TABLE admin_skills (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cost INTEGER NOT NULL DEFAULT 0,
    components JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 페트 테이블
CREATE TABLE admin_pets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    element_primary VARCHAR(20) NOT NULL,
    element_secondary VARCHAR(20),
    element_primary_ratio INTEGER DEFAULT 100,
    base_hp_min INTEGER NOT NULL DEFAULT 80,
    base_hp_max INTEGER NOT NULL DEFAULT 120,
    base_atk_min INTEGER NOT NULL DEFAULT 8,
    base_atk_max INTEGER NOT NULL DEFAULT 12,
    base_def_min INTEGER NOT NULL DEFAULT 8,
    base_def_max INTEGER NOT NULL DEFAULT 12,
    base_spd_min INTEGER NOT NULL DEFAULT 8,
    base_spd_max INTEGER NOT NULL DEFAULT 12,
    bonus_hp INTEGER NOT NULL DEFAULT 10,
    bonus_atk INTEGER NOT NULL DEFAULT 2,
    bonus_def INTEGER NOT NULL DEFAULT 2,
    bonus_spd INTEGER NOT NULL DEFAULT 2,
    growth_hp_min DECIMAL(4,2) NOT NULL DEFAULT 5.00,
    growth_hp_max DECIMAL(4,2) NOT NULL DEFAULT 10.00,
    growth_atk_min DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_atk_max DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    growth_def_min DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_def_max DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    growth_spd_min DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    growth_spd_max DECIMAL(4,2) NOT NULL DEFAULT 2.00,
    capture_rate INTEGER NOT NULL DEFAULT 50,
    total_stats INTEGER NOT NULL DEFAULT 156,
    sprite_idle TEXT,
    sprite_attack TEXT,
    sprite_hit TEXT,
    sprite_defend TEXT,
    sprite_down TEXT,
    sprite_walk TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 페트-스킬 연결 테이블
CREATE TABLE admin_pet_skills (
    id SERIAL PRIMARY KEY,
    pet_id VARCHAR(50) REFERENCES admin_pets(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) REFERENCES admin_skills(id) ON DELETE CASCADE,
    slot INTEGER NOT NULL,
    UNIQUE(pet_id, skill_id),
    UNIQUE(pet_id, slot)
);

-- 4. 스테이지 그룹 테이블
CREATE TABLE admin_stage_groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    background TEXT,
    stages JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. 개별 스테이지 테이블
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

-- 6. 상점 아이템 테이블
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
