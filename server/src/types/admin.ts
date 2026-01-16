// Admin Types - 기존 스키마 + PRD 혼합

// =====================================================
// Element Types (기존 스키마 방식)
// =====================================================
export type ElementType = 'earth' | 'water' | 'fire' | 'wind';

export interface ElementConfig {
  primary: ElementType;
  secondary?: ElementType | null;
  primaryRatio: number;  // 0-100
}

// =====================================================
// Pet Types
// =====================================================
export interface AdminPetBaseStats {
  str: number;  // 1-100
  agi: number;  // 1-100
  vit: number;  // 1-100
  con: number;  // 1-100
  int: number;  // 1-100
}

export interface AdminPetGrowthRates {
  str: number;  // 1.00-3.00
  agi: number;  // 1.00-3.00
  vit: number;  // 1.00-3.00
  con: number;  // 1.00-3.00
  int: number;  // 1.00-3.00
}

export interface AdminPetSprites {
  idle: string;
  attack: string;
  hit: string;
  defend: string;
  down: string;
  walk: string;
}

export interface AdminPet {
  id: string;
  name: string;
  element: ElementConfig;
  baseStats: AdminPetBaseStats;
  growthRates: AdminPetGrowthRates;
  sprites: AdminPetSprites;
  skills: string[];  // skill IDs
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================================
// Skill Types (PRD 방식)
// =====================================================
export type SkillComponentType =
  | 'attack'
  | 'attackPercent'
  | 'dodge'
  | 'dodgePercent'
  | 'defense'
  | 'spell';

export type SpellType =
  | 'poison'
  | 'petrify'
  | 'confusion'
  | 'freeze'
  | 'paralysis'
  | 'blind'
  | 'silence'
  | 'fear'
  | 'burn';

export interface SkillComponent {
  type: SkillComponentType;
  percent?: number;      // for attackPercent, dodgePercent
  spellType?: SpellType; // for spell
}

export interface AdminSkill {
  id: string;
  name: string;
  cost: number;
  components: SkillComponent[];
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================================
// Stage Group Types (PRD 방식)
// =====================================================
export interface StagePosition {
  stageId: string;
  x: number;
  y: number;
  order: number;
}

export interface AdminStageGroup {
  id: string;
  name: string;
  background: string;
  stages: StagePosition[];
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================================
// Individual Stage Types (PRD 방식)
// =====================================================
export interface MonsterStats {
  str: number;
  agi: number;
  vit: number;
  con: number;
  int: number;
}

export interface StageMonster {
  petId: string;
  slot: number;  // 1-10
  level: number;
  stats: MonsterStats;
  skills: string[];  // skill IDs
}

export interface WildPet {
  petId: string;
  spawnRate: number;  // percentage
}

// 별 조건 3 타입
export type StarCondition3Type = 'none' | 'no_death' | 'full_hp' | 'use_skill' | 'element_kill';

// 별 조건
export interface StageStarConditions {
  star2Turns: number;  // 0이면 비활성화
  star3Type: StarCondition3Type;
  star3Value: number;
}

// 드롭 아이템
export interface StageDrop {
  itemId: string;
  itemType: 'consumable' | 'equipment' | 'material';
  dropRate: number;  // percentage (0-100)
  minQty: number;
  maxQty: number;
}

export interface AdminStage {
  id: string;
  name: string;
  background: string;
  monsters: StageMonster[];
  wildPets: WildPet[];
  // 보상 시스템
  expReward: number;
  goldReward: number;
  // 별 조건
  starConditions: StageStarConditions;
  // 드롭 테이블
  drops: StageDrop[];
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================================
// Shop Item Types (PRD 방식 + stone 단일 재화)
// =====================================================
export type ShopCategory = 'consumable' | 'equipment' | 'material' | 'pet' | 'etc';

export interface ShopEffect {
  type: string;
  target?: string;
  value?: number;
  duration?: number;
  stats?: Record<string, number>;
}

export interface AdminShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  // currency는 stone 단일이므로 필드 없음
  icon: string;
  description: string;
  effect?: ShopEffect;
  stackable: boolean;
  maxStack: number;
  available: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// =====================================================
// API Request/Response Types
// =====================================================
export interface CreateAdminPetRequest {
  id?: string;
  name: string;
  element: ElementConfig;
  baseStats: AdminPetBaseStats;
  growthRates: AdminPetGrowthRates;
  sprites: AdminPetSprites;
  skills: string[];
}

export interface UpdateAdminPetRequest extends Partial<CreateAdminPetRequest> {}

export interface CreateAdminSkillRequest {
  id?: string;
  name: string;
  cost: number;
  components: SkillComponent[];
}

export interface UpdateAdminSkillRequest extends Partial<CreateAdminSkillRequest> {}

export interface CreateAdminStageGroupRequest {
  id?: string;
  name: string;
  background: string;
  stages: StagePosition[];
}

export interface UpdateAdminStageGroupRequest extends Partial<CreateAdminStageGroupRequest> {}

export interface CreateAdminStageRequest {
  id?: string;
  name: string;
  background: string;
  monsters: StageMonster[];
  wildPets: WildPet[];
  expReward?: number;
  goldReward?: number;
  starConditions?: StageStarConditions;
  drops?: StageDrop[];
}

export interface UpdateAdminStageRequest extends Partial<CreateAdminStageRequest> {}

export interface CreateAdminShopItemRequest {
  id?: string;
  name: string;
  category: ShopCategory;
  price: number;
  icon?: string;
  description?: string;
  effect?: ShopEffect;
  stackable?: boolean;
  maxStack?: number;
  available?: boolean;
}

export interface UpdateAdminShopItemRequest extends Partial<CreateAdminShopItemRequest> {}
