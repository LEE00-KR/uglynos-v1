// =====================================================
// 클라이언트 게임 타입 (서버와 동기화)
// 4스탯 시스템 + 기력 시스템
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
// 상태이상 (9가지)
// =====================================================

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

// =====================================================
// 전투 유닛
// =====================================================

export interface BattleUnit {
  id: string;
  type: 'character' | 'pet' | 'enemy';
  templateId?: string;
  ownerId?: string;
  name: string;
  level: number;

  // 체력
  hp: number;
  maxHp: number;

  // 기력 (캐릭터만, 고정 100)
  energy: number;
  maxEnergy: number;

  // 4스탯
  stats: BaseStats;

  // 속성
  element: ElementInfo;

  // 상태이상
  statusEffects: StatusEffect[];

  // 펫 전용
  loyalty?: number;
  growthGroup?: GrowthGroup;
  growthRates?: GrowthRates;

  // 적 전용
  isCapturable?: boolean;
  isRareColor?: boolean;
  captureRate?: number;

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
// 전투 결과
// =====================================================

export interface BattleRewards {
  exp: { characterId: string; exp: number }[];
  gold: number;
  drops: { itemType: string; itemId: string; quantity: number }[];
  stars: number;
}

export interface CaptureResult {
  success: boolean;
  catchRate?: number;
  roll?: number;
  isRareColor?: boolean;
  reason?: string;
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

// =====================================================
// 캐릭터 타입
// =====================================================

export interface Character {
  id: string;
  userId: string;
  nickname: string;
  level: number;
  exp: number;
  gold: number;

  // 외형
  appearance: {
    eye: number;
    nose: number;
    mouth: number;
    hair: number;
    skin: number;
  };

  // 속성
  element: ElementInfo;

  // 4스탯
  stats: BaseStats;
  statPoints: number;

  // 현재 상태 (자동 회복 없음)
  currentHp: number;
  currentEnergy: number;

  // 탑승 펫
  ridingPetId?: string;
}

// =====================================================
// 펫 타입
// =====================================================

export interface Pet {
  id: string;
  characterId: string;
  templateId: string;
  templateName: string;
  nickname?: string;
  level: number;
  exp: number;
  expToNextLevel: number;

  // 4스탯
  stats: BaseStats;

  // 성장률
  growthRates: GrowthRates;

  // 성장 그룹
  growthGroup: GrowthGroup;

  // 현재 HP (자동 회복 없음)
  currentHp: number;
  maxHp: number;

  // 충성도
  loyalty: number;

  // 기타
  isRareColor: boolean;
  isStarter: boolean;
  partySlot?: number;
  isRiding: boolean;

  // 속성
  element: ElementInfo;
}
