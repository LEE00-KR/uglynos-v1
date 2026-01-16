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
export interface AdminPetBaseStats {
  hp: number;   // 체력 (1-999)
  atk: number;  // 공격력 (1-100)
  def: number;  // 방어력 (1-100)
  spd: number;  // 순발력 (1-100)
}

export interface AdminPetGrowthRates {
  hp: number;   // 1.00-3.00
  atk: number;  // 1.00-3.00
  def: number;  // 1.00-3.00
  spd: number;  // 1.00-3.00
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
  skills: string[];
  createdAt?: string;
  updatedAt?: string;
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
  percent?: number;
  spellType?: SpellType;
}

export interface AdminSkill {
  id: string;
  name: string;
  cost: number;
  components: SkillComponent[];
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
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
  slot: number;
  level: number;
  stats: MonsterStats;
  skills: string[];
}

export interface WildPet {
  petId: string;
  spawnRate: number;
}

// 별 조건 3 타입
export type StarCondition3Type = 'none' | 'no_death' | 'full_hp' | 'use_skill' | 'element_kill';

// 별 조건
export interface StageStarConditions {
  star2Turns: number;  // 0이면 비활성화
  star3Type: StarCondition3Type;
  star3Value: number;
}

// 드롭 아이템 타입
export type DropItemType = 'consumable' | 'equipment' | 'material';

// 드롭 아이템
export interface StageDrop {
  itemId: string;
  itemType: DropItemType;
  dropRate: number;  // 0-100%
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
  createdAt?: string;
  updatedAt?: string;
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
  // 재화는 stone 단일
  icon: string;
  description: string;
  effect?: ShopEffect;
  stackable: boolean;
  maxStack: number;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// =====================================================
// UI Helper Types
// =====================================================
export const SPELL_TYPES: { value: SpellType; label: string; description: string }[] = [
  { value: 'poison', label: '독', description: '턴마다 최대 HP 5~10% 피해' },
  { value: 'petrify', label: '석화', description: '행동 불가, 받는 피해 -20%' },
  { value: 'confusion', label: '혼란', description: '타겟 랜덤 (자신/적/아군 각 33%)' },
  { value: 'freeze', label: '동결', description: '행동 불가, 화속성 공격시 해제' },
  { value: 'paralysis', label: '마비', description: '50% 확률 행동, 민첩 -30%' },
  { value: 'blind', label: '실명', description: '명중률 -30%' },
  { value: 'silence', label: '침묵', description: '스킬 사용 불가' },
  { value: 'fear', label: '공포', description: '방어/도주만 가능' },
  { value: 'burn', label: '화상', description: '공격력 -20%, 턴마다 HP 3~5% 피해' },
];

export const SKILL_COMPONENT_TYPES: { value: SkillComponentType; label: string; hasParam: boolean; paramLabel?: string }[] = [
  { value: 'attack', label: '공격', hasParam: false },
  { value: 'attackPercent', label: '공격력 배율', hasParam: true, paramLabel: '배율 (%)' },
  { value: 'dodge', label: '회피', hasParam: false },
  { value: 'dodgePercent', label: '회피율 배율', hasParam: true, paramLabel: '배율 (%)' },
  { value: 'defense', label: '방어', hasParam: false },
  { value: 'spell', label: '주술', hasParam: true, paramLabel: '주술 종류' },
];

export const SHOP_CATEGORIES: { value: ShopCategory; label: string }[] = [
  { value: 'consumable', label: '소비' },
  { value: 'equipment', label: '장비' },
  { value: 'material', label: '재료' },
  { value: 'pet', label: '페트' },
  { value: 'etc', label: '기타' },
];

export const ELEMENTS: ElementType[] = ['earth', 'water', 'fire', 'wind'];
export const ELEMENT_LABELS: Record<ElementType, string> = {
  earth: '지',
  water: '수',
  fire: '화',
  wind: '풍',
};
export const ELEMENT_COLORS: Record<ElementType, string> = {
  earth: 'bg-amber-600',
  water: 'bg-blue-500',
  fire: 'bg-red-500',
  wind: 'bg-green-500',
};

export const STATS = ['hp', 'atk', 'def', 'spd'] as const;
export const STAT_LABELS: Record<string, string> = {
  hp: 'HP (체력)',
  atk: 'ATK (공격력)',
  def: 'DEF (방어력)',
  spd: 'SPD (순발력)',
};

// 별 조건 3 타입
export const STAR_CONDITION_3_TYPES: { value: StarCondition3Type; label: string; hasValue: boolean }[] = [
  { value: 'none', label: '없음', hasValue: false },
  { value: 'no_death', label: '아군 사망 없이 클리어', hasValue: false },
  { value: 'full_hp', label: '체력 N% 이상 유지', hasValue: true },
  { value: 'use_skill', label: '특정 스킬 N회 사용', hasValue: true },
  { value: 'element_kill', label: '특정 속성으로 N마리 처치', hasValue: true },
];

// 드롭 아이템 타입
export const DROP_ITEM_TYPES: { value: DropItemType; label: string }[] = [
  { value: 'consumable', label: '소비' },
  { value: 'equipment', label: '장비' },
  { value: 'material', label: '재료' },
];
