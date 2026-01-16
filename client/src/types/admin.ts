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
  str: number;
  agi: number;
  vit: number;
  con: number;
  int: number;
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

export interface AdminStage {
  id: string;
  name: string;
  background: string;
  monsters: StageMonster[];
  wildPets: WildPet[];
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

export const STATS = ['str', 'agi', 'vit', 'con', 'int'] as const;
export const STAT_LABELS: Record<string, string> = {
  str: 'STR (힘)',
  agi: 'AGI (민첩)',
  vit: 'VIT (체력)',
  con: 'CON (정신)',
  int: 'INT (지능)',
};
