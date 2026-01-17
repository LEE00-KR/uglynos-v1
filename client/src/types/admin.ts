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

// 스탯 범위 (min / base / max)
export interface StatRange {
  min: number;
  base: number;
  max: number;
}

// 기본 스탯 범위 (Species 템플릿용)
export interface AdminPetBaseStatsRange {
  hp: StatRange;   // 체력 범위 (1-999)
  atk: StatRange;  // 공격력 범위 (1-100)
  def: StatRange;  // 방어력 범위 (1-100)
  spd: StatRange;  // 순발력 범위 (1-100)
}

// 보너스 풀 (Species 템플릿용) - 제거됨, base/min/max로 대체

// 성장률 범위 (Species 템플릿용)
export interface AdminPetGrowthRatesRange {
  hp: StatRange;   // HP 성장률 범위
  atk: StatRange;  // ATK 성장률 범위
  def: StatRange;  // DEF 성장률 범위
  spd: StatRange;  // SPD 성장률 범위
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

// 성장 그룹 타입 (S++/S+ 추가, 확률 기반)
export type GrowthGroup = 'S++' | 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

// 확률 기반 성장 그룹 결정
export interface GrowthGroupConfig {
  group: GrowthGroup;
  probability: number;     // 확률 (%)
  multiplier: number;      // 기준 배수
  multiplierMin: number;   // 최소 배수
  multiplierMax: number;   // 최대 배수
  label: string;           // 표시명
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
  // Species 템플릿 (min/base/max 기반)
  baseStatsRange: AdminPetBaseStatsRange;
  growthRatesRange: AdminPetGrowthRatesRange;
  // 스프라이트
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

// 상점 타입 (어떤 상점에 소속되는지)
export type ShopType = 'general' | 'premium' | 'event' | 'special';

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
  shopType: ShopType;  // 소속 상점
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

export const SHOP_TYPES: { value: ShopType; label: string }[] = [
  { value: 'general', label: '일반 상점' },
  { value: 'premium', label: '프리미엄 상점' },
  { value: 'event', label: '이벤트 상점' },
  { value: 'special', label: '특별 상점' },
];

export const ELEMENTS: ElementType[] = ['earth', 'water', 'fire', 'wind'];
export const ELEMENT_LABELS: Record<ElementType, string> = {
  earth: '지(地)',
  water: '수(水)',
  fire: '화(火)',
  wind: '풍(風)',
};
export const ELEMENT_LABELS_KR: Record<ElementType, string> = {
  earth: '지(地)',
  water: '수(水)',
  fire: '화(火)',
  wind: '풍(風)',
};
export const ELEMENT_COLORS: Record<ElementType, string> = {
  earth: 'bg-green-500',   // 지 = 초록
  water: 'bg-blue-500',    // 수 = 파랑
  fire: 'bg-red-500',      // 화 = 빨강
  wind: 'bg-yellow-500',   // 풍 = 노랑
};

export const STATS = ['hp', 'atk', 'def', 'spd'] as const;
export const STAT_LABELS: Record<string, string> = {
  hp: 'HP (체력)',
  atk: 'ATK (공격력)',
  def: 'DEF (방어력)',
  spd: 'SPD (순발력)',
};

// 성장 그룹 설정 (확률 기반 + 범위)
// 100마리 포획 시: S++=0.4마리, S+=1마리, S=2마리, A=10마리, B=50마리, C=25마리, D=11.6마리
// 각 그룹 내에서 배수 범위가 있어 무작위 성장계수 적용

export const GROWTH_GROUPS: GrowthGroupConfig[] = [
  { group: 'S++', probability: 0.4, multiplier: 1.10, multiplierMin: 1.08, multiplierMax: 1.12, label: '전설' },
  { group: 'S+',  probability: 1.0, multiplier: 1.05, multiplierMin: 1.03, multiplierMax: 1.07, label: '영웅' },
  { group: 'S',   probability: 2.0, multiplier: 1.00, multiplierMin: 0.98, multiplierMax: 1.02, label: '최상' },
  { group: 'A',   probability: 10.0, multiplier: 0.95, multiplierMin: 0.93, multiplierMax: 0.97, label: '상' },
  { group: 'B',   probability: 50.0, multiplier: 0.90, multiplierMin: 0.88, multiplierMax: 0.92, label: '중' },
  { group: 'C',   probability: 25.0, multiplier: 0.85, multiplierMin: 0.83, multiplierMax: 0.87, label: '하' },
  { group: 'D',   probability: 11.6, multiplier: 0.80, multiplierMin: 0.78, multiplierMax: 0.82, label: '최하' },
];

export const GROWTH_GROUP_LABELS: Record<GrowthGroup, string> = {
  'S++': 'S++ (전설, 0.4%)',
  'S+': 'S+ (영웅, 1%)',
  'S': 'S (최상, 2%)',
  'A': 'A (상, 10%)',
  'B': 'B (중, 50%)',
  'C': 'C (하, 25%)',
  'D': 'D (최하, 11.6%)',
};

export const GROWTH_GROUP_COLORS: Record<GrowthGroup, string> = {
  'S++': 'bg-fuchsia-500',   // 전설 - 보라/핑크
  'S+': 'bg-orange-500',     // 영웅 - 주황
  'S': 'bg-yellow-500',      // 최상 - 금색
  'A': 'bg-purple-500',      // 상 - 은색/보라
  'B': 'bg-blue-500',        // 중 - 파랑
  'C': 'bg-green-500',       // 하 - 초록
  'D': 'bg-gray-500',        // 최하 - 회색
};

// 성장 그룹 배수 가져오기
export const getGrowthMultiplier = (group: GrowthGroup): number => {
  const config = GROWTH_GROUPS.find(g => g.group === group);
  return config?.multiplier ?? 0.9;
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
