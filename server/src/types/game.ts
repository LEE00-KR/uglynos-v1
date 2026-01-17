// =====================================================
// 4스탯 시스템 + 기력 시스템
// 어드민 스키마 기준으로 통일
// =====================================================

// Element types
export type ElementType = 'earth' | 'wind' | 'fire' | 'water';

// Element info for compound elements
export interface ElementInfo {
  primary: ElementType;
  secondary?: ElementType;
  primaryRatio: number;  // 0-100
}

// =====================================================
// 4스탯 시스템 (HP, ATK, DEF, SPD)
// =====================================================

// 기본 스탯 (4스탯)
export interface BaseStats {
  hp: number;   // 체력
  atk: number;  // 공격력
  def: number;  // 방어력
  spd: number;  // 순발력
}

// 성장률 (4스탯)
export interface GrowthRates {
  hp: number;   // HP 성장률 (레벨당)
  atk: number;  // ATK 성장률
  def: number;  // DEF 성장률
  spd: number;  // SPD 성장률
}

// 성장 그룹
export type GrowthGroup = 'S' | 'A' | 'B' | 'C' | 'D';

// =====================================================
// 전투 유닛 (캐릭터/펫/적)
// =====================================================

// Status effect types (9가지)
export type StatusEffectType =
  | 'poison'     // 독: 턴마다 HP 5-10% 피해
  | 'petrify'    // 석화: 행동 불가, 받는 피해 -20%
  | 'confusion'  // 혼란: 타겟 랜덤
  | 'freeze'     // 동결: 행동 불가, 화속성에 해제
  | 'paralysis'  // 마비: 50% 행동, SPD -30%
  | 'blind'      // 실명: 명중률 -30%
  | 'silence'    // 침묵: 스킬 불가
  | 'fear'       // 공포: 방어/도주만 가능
  | 'burn';      // 화상: ATK -20%, 턴마다 HP 3-5% 피해

export interface StatusEffect {
  type: StatusEffectType;
  remainingTurns: number;
  appliedAt: number;
}

// Weapon types
export type WeaponType = 'sword' | 'club' | 'axe' | 'spear' | 'claw' | 'bow';

// Equipment slot types
export type EquipmentSlotType =
  | 'weapon'
  | 'armor'
  | 'helmet'
  | 'bracelet'
  | 'necklace';

// 장비 정보
export interface EquipmentInfo {
  id: string;
  templateId: string;  // string으로 통일
  slotType: EquipmentSlotType;
  weaponType?: WeaponType;
  stats: BaseStats;  // 4스탯
  attackRatio: number;
  accuracy: number;
  hitCount: number;
  durability: number;
  spellId?: string;
}

// 펫 스킬
export interface PetSkill {
  id: string;  // string으로 통일
  name: string;
  element?: ElementType;
  damageRatio?: number;
  effectType: string;
  targetType: string;
  energyCost: number;  // mp → energy (기력)
}

// 전투 유닛
export interface BattleUnit {
  id: string;
  type: 'character' | 'pet' | 'enemy';
  templateId?: string;  // string으로 통일 (admin_pets.id)
  ownerId?: string;
  name: string;
  level: number;

  // 체력
  hp: number;
  maxHp: number;

  // 기력 (캐릭터만 사용, 고정 100)
  energy: number;
  maxEnergy: number;  // 항상 100

  // 4스탯
  stats: BaseStats;

  // 속성
  element: ElementInfo;

  // 상태이상
  statusEffects: StatusEffect[];

  // 장비 (캐릭터만)
  equipment?: EquipmentInfo;

  // 스킬 (펫/적)
  skills?: PetSkill[];

  // 펫 전용
  loyalty?: number;
  isRiding?: boolean;
  isRepresentative?: boolean;
  ridingPetId?: string;
  growthGroup?: GrowthGroup;
  growthRates?: GrowthRates;

  // 적 전용
  isCapturable?: boolean;
  isRareColor?: boolean;

  // 전투 상태
  isAlive: boolean;
  isDefending: boolean;
}

// =====================================================
// 전투 액션
// =====================================================

export type ActionType =
  | 'attack'
  | 'defend'
  | 'skill'
  | 'item'
  | 'capture'
  | 'wait'
  | 'flee';

export interface BattleAction {
  actorId: string;
  type: ActionType;
  targetId?: string;
  skillId?: string;
  itemId?: string;
  reason?: string;
}

// =====================================================
// 전투 상태
// =====================================================

export interface Drop {
  itemType: 'material' | 'equipment' | 'consumable';
  itemId: string;  // string으로 통일
  quantity: number;
}

export interface BattleState {
  id: string;
  stageId: string;  // string으로 통일 (admin_stages.id)
  phase: 'waiting' | 'in_progress' | 'victory' | 'defeat' | 'fled';
  turnNumber: number;
  units: Map<string, BattleUnit>;
  turnOrder: string[];
  currentTurnIndex: number;
  pendingActions: Map<string, BattleAction>;
  partyId?: string;
  participants: string[];
  turnStartedAt: number;
  turnTimeout: number;
  potentialDrops: Drop[];
  createdAt: number;
  updatedAt: number;
}

// =====================================================
// 데미지 계산
// =====================================================

export interface DamageOptions {
  weaponInfo?: EquipmentInfo;
  attackElement?: ElementInfo;
  critChance?: number;
  gangUpBonus?: number;
}

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  elementMultiplier: number;
  statusWeaknessMultiplier: number;
  wasDefending: boolean;
}

// =====================================================
// 전투 보상
// =====================================================

export interface BattleRewards {
  exp: ExpReward[];
  gold: number;
  drops: DroppedItem[];
  stars: number;
}

export interface ExpReward {
  characterId: string;
  exp: number;
}

export interface DroppedItem {
  itemType: 'material' | 'equipment' | 'consumable';
  itemId: string;  // string으로 통일
  quantity: number;
}

// =====================================================
// 포획 결과
// =====================================================

export interface CaptureResult {
  success: boolean;
  catchRate?: number;
  roll?: number;
  isRareColor?: boolean;
  reason?: string;
}

// =====================================================
// 불순종 (펫 충성도)
// =====================================================

export interface DisobeyResult {
  disobeyed: boolean;
  action?: string;
  message?: string;
}

// =====================================================
// 회피율 계산 (SPD 기반)
// 최고 SPD 만렙에서 30% 이하
// 공식: min(30, SPD * 0.15)
// =====================================================

export const calculateEvasionRate = (spd: number): number => {
  return Math.min(30, spd * 0.15);
};

// =====================================================
// 기력 상수
// =====================================================

export const MAX_ENERGY = 100;  // 캐릭터 기력 고정값
export const DEFAULT_ENERGY = 100;
