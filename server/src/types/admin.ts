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
// Pet Types (4스텟: 체력, 공격력, 방어력, 순발력)
// =====================================================

// 스탯 범위 (min ~ max)
export interface StatRange {
  min: number;
  max: number;
}

// 기본 스탯 범위 (Species 템플릿용)
export interface AdminPetBaseStatsRange {
  hp: StatRange;   // 체력 범위 (1-999)
  atk: StatRange;  // 공격력 범위 (1-100)
  def: StatRange;  // 방어력 범위 (1-100)
  spd: StatRange;  // 순발력 범위 (1-100)
}

// 보너스 풀 (Species 템플릿용)
export interface AdminPetBonusPool {
  hp: number;   // HP 보너스 풀 (0-50)
  atk: number;  // ATK 보너스 풀 (0-10)
  def: number;  // DEF 보너스 풀 (0-10)
  spd: number;  // SPD 보너스 풀 (0-10)
}

// 성장률 범위 (Species 템플릿용)
export interface AdminPetGrowthRatesRange {
  hp: StatRange;   // 1.00-3.00
  atk: StatRange;  // 1.00-3.00
  def: StatRange;  // 1.00-3.00
  spd: StatRange;  // 1.00-3.00
}

// 고정 스탯 (레거시 호환용)
export interface AdminPetBaseStats {
  hp: number;   // 체력 (1-999)
  atk: number;  // 공격력 (1-100)
  def: number;  // 방어력 (1-100)
  spd: number;  // 순발력 (1-100)
}

// 고정 성장률 (레거시 호환용)
export interface AdminPetGrowthRates {
  hp: number;   // 1.00-3.00
  atk: number;  // 1.00-3.00
  def: number;  // 1.00-3.00
  spd: number;  // 1.00-3.00
}

// 성장 그룹 타입
export type GrowthGroup = 'S' | 'A' | 'B' | 'C' | 'D';

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
  // Species 템플릿 (범위 기반)
  baseStatsRange: AdminPetBaseStatsRange;
  bonusPool: AdminPetBonusPool;
  growthRatesRange: AdminPetGrowthRatesRange;
  // 총합 스탯 (자동 계산용)
  totalStats: number;
  // 스프라이트
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
  hp: number;   // 체력
  atk: number;  // 공격력
  def: number;  // 방어력
  spd: number;  // 순발력
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
  baseStatsRange: AdminPetBaseStatsRange;
  bonusPool: AdminPetBonusPool;
  growthRatesRange: AdminPetGrowthRatesRange;
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
