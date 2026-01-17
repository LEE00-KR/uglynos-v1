import type { BaseStats, ElementType, WeaponType } from '../types/game.js';

// =====================================================
// 기력 상수
// =====================================================
export const MAX_ENERGY = 100;
export const DEFAULT_ENERGY = 100;

// =====================================================
// 회피율 계산 (SPD 기반)
// 최고 SPD 만렙에서 30% 이하
// 공식: min(30, SPD * 0.15)
// =====================================================
export const calculateEvasionRate = (spd: number): number => {
  return Math.min(30, spd * 0.15);
};

// =====================================================
// 경험치 테이블
// =====================================================
export const getRequiredExp = (level: number): number => {
  const earlyLevels: Record<number, number> = {
    1: 8,
    2: 20,
    3: 40,
    4: 100,
  };

  if (earlyLevels[level]) {
    return earlyLevels[level];
  }

  if (level < 30) {
    return Math.floor(100 * Math.pow(1.15, level - 4));
  } else if (level < 70) {
    return Math.floor(100 * Math.pow(1.15, 26) * Math.pow(1.2, level - 30));
  } else {
    return Math.floor(
      100 * Math.pow(1.15, 26) * Math.pow(1.2, 40) * Math.pow(1.3, level - 70)
    );
  }
};

// =====================================================
// 몬스터 경험치
// 공식: Lv × (2 + Lv/20)
// =====================================================
export const calculateMonsterExp = (level: number, isBoss: boolean): number => {
  const base = level * (2 + level / 20);
  return Math.floor(isBoss ? base * 1.1 : base);
};

// =====================================================
// 무기 관련 공식
// =====================================================

export const getWeaponAccuracy = (weaponType: WeaponType): number => {
  const accuracies: Record<WeaponType, number> = {
    sword: 90,
    club: 100,
    axe: 90,
    spear: 80,
    claw: 90,
    bow: 80,
  };
  return accuracies[weaponType];
};

export const getWeaponMultiplier = (weaponType: WeaponType): number => {
  const multipliers: Record<WeaponType, number> = {
    sword: 1.5,   // 150%
    club: 1.0,    // 100%
    axe: 2.0,     // 200%
    spear: 0.9,   // 90% × 2
    claw: 0.4,    // 40% × 3
    bow: 0.8,     // 80% × random
  };
  return multipliers[weaponType];
};

export const getWeaponHitCount = (
  weaponType: WeaponType,
  enemyCount?: number
): number => {
  switch (weaponType) {
    case 'spear':
      return 2;
    case 'claw':
      return 3;
    case 'bow': {
      const max = enemyCount || 1;
      return Math.floor(Math.random() * max) + 1;
    }
    default:
      return 1;
  }
};

export const getWeaponPenalty = (
  weaponType: WeaponType
): { spd: number; def: number } => {
  // 4스탯 시스템에 맞게 spd, def로 변경
  const penalties: Record<WeaponType, { spd: number; def: number }> = {
    sword: { spd: -10, def: 0 },
    club: { spd: 0, def: 0 },
    axe: { spd: -20, def: -20 },
    spear: { spd: -20, def: 0 },
    claw: { spd: 0, def: 0 },
    bow: { spd: 0, def: 0 },
  };
  return penalties[weaponType];
};

// =====================================================
// 속성 상성
// 상성: 지 → 풍 → 화 → 수 → 지
// =====================================================
export const getElementMultiplier = (
  attackElement: ElementType,
  defenseElement: ElementType
): number => {
  const advantage: Record<ElementType, ElementType> = {
    earth: 'wind',
    wind: 'fire',
    fire: 'water',
    water: 'earth',
  };

  const disadvantage: Record<ElementType, ElementType> = {
    earth: 'water',
    wind: 'earth',
    fire: 'wind',
    water: 'fire',
  };

  if (advantage[attackElement] === defenseElement) {
    return 1.3; // 130%
  }
  if (disadvantage[attackElement] === defenseElement) {
    return 0.7; // 70%
  }
  return 1.0;
};

// =====================================================
// 충성도 효과
// =====================================================
export const getLoyaltyEffects = (loyalty: number) => {
  if (loyalty >= 100) {
    return {
      damageBonus: 0.1,
      accuracyBonus: 0.05,
      disobeyChance: 0,
      fleeRisk: false,
    };
  }
  if (loyalty >= 70) {
    return {
      damageBonus: 0.05,
      accuracyBonus: 0.02,
      disobeyChance: 0.05,
      fleeRisk: false,
    };
  }
  if (loyalty >= 50) {
    return {
      damageBonus: 0,
      accuracyBonus: 0,
      disobeyChance: 0.15,
      fleeRisk: false,
    };
  }
  if (loyalty >= 30) {
    return {
      damageBonus: -0.1,
      accuracyBonus: -0.05,
      disobeyChance: 0.3,
      fleeRisk: true,
    };
  }
  return {
    damageBonus: -0.2,
    accuracyBonus: -0.1,
    disobeyChance: 0.5,
    fleeRisk: true,
  };
};

// =====================================================
// 레벨 차이 충성도 페널티
// =====================================================
export const calculateLevelDiffPenalty = (
  charLevel: number,
  petLevel: number
): number => {
  const diff = petLevel - charLevel;
  if (diff <= 0) return 0;
  if (diff <= 5) return 0;
  if (diff <= 10) return -10;
  if (diff <= 20) return -20;
  return -50;
};

// =====================================================
// 파티 경험치 보너스
// 1명: 100%, 2명: 103%, 3명: 106%, 4명: 109%, 5명: 120%
// =====================================================
export const getPartyExpBonus = (memberCount: number): number => {
  const bonuses: Record<number, number> = {
    1: 1.0,
    2: 1.03,
    3: 1.06,
    4: 1.09,
    5: 1.2,
  };
  return bonuses[memberCount] || 1.0;
};

// =====================================================
// 레벨 차이 경험치 페널티
// =====================================================
export const getLevelPenalty = (levelDiff: number): number => {
  if (levelDiff <= 10) return 1.0;
  if (levelDiff <= 20) return 1.0 - (levelDiff - 10) * 0.005;
  if (levelDiff <= 30) return 0.95 - (levelDiff - 20) * 0.014;
  return 0.5;
};

// =====================================================
// 내구도 손실 계산
// =====================================================
export const calculateDurabilityLoss = (
  isCriticalHit: boolean
): number => {
  const baseLoss = 0.5;
  return isCriticalHit ? baseLoss * 2 : baseLoss;
};

// =====================================================
// 다굴 크리티컬 보너스
// =====================================================
export const getGangUpCritBonus = (participantCount: number): number => {
  return Math.min((participantCount - 1) * 10, 50);
};

// =====================================================
// 포획률 계산
// 기본 5%, HP에 따라 증가, 캐릭터 레벨에 따라 추가 보너스
// =====================================================
export const calculateCatchRate = (
  targetHpRatio: number,
  catcherLevel: number = 1,
  itemBonus: number = 0
): number => {
  // HP 기반 기본 포획률 (낮을수록 높음)
  let rate: number;
  if (targetHpRatio <= 0.1) {
    rate = 30;  // HP 10% 이하
  } else if (targetHpRatio <= 0.5) {
    rate = 20;  // HP 50% 이하
  } else if (targetHpRatio <= 0.8) {
    rate = 10;  // HP 80% 이하
  } else {
    rate = 5;   // HP 80% 초과 (기본)
  }

  // 캐릭터 레벨 보너스
  if (catcherLevel >= 80) {
    rate += 30;
  } else if (catcherLevel >= 50) {
    rate += 20;
  } else if (catcherLevel >= 30) {
    rate += 10;
  }

  // 아이템 보너스
  rate += itemBonus;

  return Math.min(rate, 95); // Max 95%
};

// =====================================================
// 랜덤 펫 스탯 생성 (4스탯)
// 템플릿의 min/base/max 범위 내에서 랜덤 생성
// =====================================================
export interface StatRange {
  min: number;
  base: number;
  max: number;
}

export interface PetStatsRange {
  hp: StatRange;
  atk: StatRange;
  def: StatRange;
  spd: StatRange;
}

// 레거시 호환 - bonusPool 제거됨
export interface PetBonusPool {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export const generateRandomPetStats = (
  baseStatsRange: PetStatsRange,
  _bonusPool?: PetBonusPool  // 레거시 호환, 더 이상 사용하지 않음
): BaseStats => {
  // min과 max 범위 내에서 랜덤 생성
  const hp = Math.floor(
    Math.random() * (baseStatsRange.hp.max - baseStatsRange.hp.min + 1) +
      baseStatsRange.hp.min
  );
  const atk = Math.floor(
    Math.random() * (baseStatsRange.atk.max - baseStatsRange.atk.min + 1) +
      baseStatsRange.atk.min
  );
  const def = Math.floor(
    Math.random() * (baseStatsRange.def.max - baseStatsRange.def.min + 1) +
      baseStatsRange.def.min
  );
  const spd = Math.floor(
    Math.random() * (baseStatsRange.spd.max - baseStatsRange.spd.min + 1) +
      baseStatsRange.spd.min
  );

  return { hp, atk, def, spd };
};

// =====================================================
// 랜덤 성장률 생성 (4스탯)
// min/base/max 구조, min~max 범위 내에서 랜덤 생성
// =====================================================
export interface GrowthRatesRange {
  hp: StatRange;
  atk: StatRange;
  def: StatRange;
  spd: StatRange;
}

export const generateRandomGrowthRates = (
  growthRatesRange: GrowthRatesRange
): { hp: number; atk: number; def: number; spd: number } => {
  return {
    hp: parseFloat(
      (
        Math.random() * (growthRatesRange.hp.max - growthRatesRange.hp.min) +
        growthRatesRange.hp.min
      ).toFixed(2)
    ),
    atk: parseFloat(
      (
        Math.random() * (growthRatesRange.atk.max - growthRatesRange.atk.min) +
        growthRatesRange.atk.min
      ).toFixed(2)
    ),
    def: parseFloat(
      (
        Math.random() * (growthRatesRange.def.max - growthRatesRange.def.min) +
        growthRatesRange.def.min
      ).toFixed(2)
    ),
    spd: parseFloat(
      (
        Math.random() * (growthRatesRange.spd.max - growthRatesRange.spd.min) +
        growthRatesRange.spd.min
      ).toFixed(2)
    ),
  };
};

// =====================================================
// 성장 그룹 계산 (확률 기반)
// S++/S+ 추가, 정규분포 확률
// =====================================================
export type GrowthGroup = 'S++' | 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

// 성장 그룹 설정 (확률 기반 + 범위)
// 100마리 포획 시: S++=0.4마리, S+=1마리, S=2마리, A=10마리, B=50마리, C=25마리, D=11.6마리
// 기준 성장률 대비 차이:
// S++: +0.2, S+: +0.1, S: +0.05, A: 동급, B: -0.1~0.2, C: -0.3, D: -0.5+
export const GROWTH_GROUP_CONFIG: Record<GrowthGroup, {
  probability: number;     // 확률 (%)
  multiplier: number;      // 기준 배수
  multiplierMin: number;   // 최소 배수
  multiplierMax: number;   // 최대 배수
  label: string;           // 표시명
  color: string;           // 색상
}> = {
  'S++': { probability: 0.4, multiplier: 1.04, multiplierMin: 1.03, multiplierMax: 1.05, label: 'S++', color: '#FF00FF' },
  'S+':  { probability: 1.0, multiplier: 1.02, multiplierMin: 1.01, multiplierMax: 1.03, label: 'S+', color: '#FF4500' },
  'S':   { probability: 2.0, multiplier: 1.01, multiplierMin: 1.00, multiplierMax: 1.02, label: 'S', color: '#FFD700' },
  'A':   { probability: 10.0, multiplier: 1.00, multiplierMin: 0.99, multiplierMax: 1.01, label: 'A', color: '#C0C0C0' },
  'B':   { probability: 50.0, multiplier: 0.97, multiplierMin: 0.95, multiplierMax: 0.99, label: 'B', color: '#CD7F32' },
  'C':   { probability: 25.0, multiplier: 0.94, multiplierMin: 0.92, multiplierMax: 0.96, label: 'C', color: '#808080' },
  'D':   { probability: 11.6, multiplier: 0.90, multiplierMin: 0.88, multiplierMax: 0.92, label: 'D', color: '#404040' },
} as const;

// 성장 그룹 순서 (확률 누적 계산용)
export const GROWTH_GROUP_ORDER: GrowthGroup[] = ['S++', 'S+', 'S', 'A', 'B', 'C', 'D'];

// 최대 총합 스탯 (기준점 - 레거시 호환)
export const MAX_TOTAL_STATS = 1299;  // HP(999) + ATK(100) + DEF(100) + SPD(100)

/**
 * 성장 그룹 결정 (확률 기반)
 * 랜덤 확률로 등급 결정
 */
export const calculateGrowthGroup = (
  _stats?: BaseStats,
  _maxPossibleStats?: number
): GrowthGroup => {
  const roll = Math.random() * 100;  // 0-100
  let cumulative = 0;

  for (const group of GROWTH_GROUP_ORDER) {
    cumulative += GROWTH_GROUP_CONFIG[group].probability;
    if (roll < cumulative) {
      return group;
    }
  }

  return 'D';  // 기본값
};

/**
 * 성장 그룹 배수 반환 (기준값)
 */
export const getGrowthMultiplier = (group: GrowthGroup): number => {
  return GROWTH_GROUP_CONFIG[group]?.multiplier ?? 0.9;
};

/**
 * 성장 그룹 범위 내 랜덤 배수 반환
 * 펫 생성 시 사용 - 각 그룹 내에서도 개체차 발생
 */
export const getRandomGrowthMultiplier = (group: GrowthGroup): number => {
  const config = GROWTH_GROUP_CONFIG[group];
  if (!config) return 0.9;
  return config.multiplierMin + Math.random() * (config.multiplierMax - config.multiplierMin);
};

// =====================================================
// 레벨업 스탯 증가 계산
// 성장률 × 성장 그룹 배수 × (0.8~1.2 랜덤)
// =====================================================
export const calculateLevelUpStatIncrease = (
  growthRate: number,
  growthGroup: GrowthGroup
): number => {
  const multiplier = getGrowthMultiplier(growthGroup);
  const variance = 0.8 + Math.random() * 0.4;  // 0.8 ~ 1.2
  return Math.max(1, Math.floor(growthRate * multiplier * variance));
};

// =====================================================
// 초기 스탯 기반 성장 시스템 (ISG: Initial Stat Grade)
// 초기 스탯 위치에 따라 성장 그룹 천장 및 확률 조정
// =====================================================

/**
 * ISG (Initial Stat Grade) 계산
 * 초기 스탯이 min~max 범위에서 어느 위치인지 0~1로 반환
 * 0 = 최소, 0.5 = 기준(base), 1 = 최대
 */
export const calculateISG = (
  actualStat: number,
  minStat: number,
  maxStat: number
): number => {
  if (maxStat === minStat) return 0.5;
  return (actualStat - minStat) / (maxStat - minStat);
};

/**
 * 성장 그룹 천장 계산 (ISG 기반)
 * 낮은 초기 스탯은 높은 성장 그룹에 도달할 수 없음
 *
 * ISG 0.00~0.25 → 최대 B (index 4)
 * ISG 0.25~0.40 → 최대 A (index 3)
 * ISG 0.40~0.50 → 최대 S (index 2)
 * ISG 0.50+     → 천장 없음 (S++ 가능)
 */
export const getGrowthCeilingIndex = (isg: number): number => {
  if (isg < 0.25) return 4;  // 최대 B
  if (isg < 0.40) return 3;  // 최대 A
  if (isg < 0.50) return 2;  // 최대 S
  return 0;  // 천장 없음 (S++ 가능)
};

/**
 * 성장 그룹 천장 적용
 * 당첨된 성장 그룹이 천장보다 높으면 천장으로 제한
 */
export const applyGrowthCeiling = (
  rolledGroup: GrowthGroup,
  isg: number
): GrowthGroup => {
  const ceilingIndex = getGrowthCeilingIndex(isg);
  const rolledIndex = GROWTH_GROUP_ORDER.indexOf(rolledGroup);

  // 당첨 등급이 천장보다 높으면 (인덱스가 작으면) 천장으로 제한
  if (rolledIndex < ceilingIndex) {
    return GROWTH_GROUP_ORDER[ceilingIndex];
  }

  return rolledGroup;
};

/**
 * ISG 기반 확률 보정 계수 계산
 * 정석(ISG=0.5) 근처에서 가장 높은 확률, 멀어질수록 감소
 *
 * 가우시안 분포 사용: e^(-(deviation²) / (2σ²))
 * σ = 0.25
 */
export const getProbabilityModifier = (isg: number): number => {
  const deviation = isg - 0.5;  // 정석 대비 편차
  const sigma = 0.25;
  return Math.exp(-(deviation * deviation) / (2 * sigma * sigma));
};

/**
 * 스탯별 성장 그룹 계산 (ISG 기반 천장 + 확률 보정 적용)
 *
 * @param baseGroup - 기본 당첨 성장 그룹 (전체 펫에 대해 1회 롤)
 * @param initialStats - 초기 스탯 (포획 시 결정된 값)
 * @param statsRange - 종족 스탯 범위 (min/max)
 * @returns 스탯별 실제 적용 성장 그룹
 */
export const calculatePerStatGrowthGroups = (
  baseGroup: GrowthGroup,
  initialStats: BaseStats,
  statsRange: PetStatsRange
): { hp: GrowthGroup; atk: GrowthGroup; def: GrowthGroup; spd: GrowthGroup } => {
  // 각 스탯별 ISG 계산
  const hpISG = calculateISG(initialStats.hp, statsRange.hp.min, statsRange.hp.max);
  const atkISG = calculateISG(initialStats.atk, statsRange.atk.min, statsRange.atk.max);
  const defISG = calculateISG(initialStats.def, statsRange.def.min, statsRange.def.max);
  const spdISG = calculateISG(initialStats.spd, statsRange.spd.min, statsRange.spd.max);

  // 각 스탯별 천장 적용
  return {
    hp: applyGrowthCeiling(baseGroup, hpISG),
    atk: applyGrowthCeiling(baseGroup, atkISG),
    def: applyGrowthCeiling(baseGroup, defISG),
    spd: applyGrowthCeiling(baseGroup, spdISG),
  };
};

/**
 * 스탯별 레벨업 증가량 계산 (새 시스템)
 *
 * @param baseGrowthRate - 종족 기준 성장률
 * @param perStatGrowthGroups - 스탯별 성장 그룹
 * @returns 각 스탯 증가량
 */
export const calculatePerStatLevelUp = (
  baseGrowthRate: { hp: number; atk: number; def: number; spd: number },
  perStatGrowthGroups: { hp: GrowthGroup; atk: GrowthGroup; def: GrowthGroup; spd: GrowthGroup }
): { hp: number; atk: number; def: number; spd: number } => {
  const variance = () => 0.8 + Math.random() * 0.4;  // 0.8 ~ 1.2

  return {
    hp: Math.max(1, Math.floor(
      baseGrowthRate.hp * getGrowthMultiplier(perStatGrowthGroups.hp) * variance()
    )),
    atk: Math.max(1, Math.floor(
      baseGrowthRate.atk * getGrowthMultiplier(perStatGrowthGroups.atk) * variance()
    )),
    def: Math.max(1, Math.floor(
      baseGrowthRate.def * getGrowthMultiplier(perStatGrowthGroups.def) * variance()
    )),
    spd: Math.max(1, Math.floor(
      baseGrowthRate.spd * getGrowthMultiplier(perStatGrowthGroups.spd) * variance()
    )),
  };
};

/**
 * 펫 생성 시 성장 정보 생성 (포획 시 호출)
 *
 * @param initialStats - 생성된 초기 스탯
 * @param statsRange - 종족 스탯 범위
 * @returns 내부 저장용 성장 정보 (유저에게 노출되지 않음)
 */
export interface PetGrowthInfo {
  baseGroup: GrowthGroup;                    // 기본 당첨 성장 그룹
  perStatGroups: {                           // 스탯별 실제 성장 그룹 (천장 적용됨)
    hp: GrowthGroup;
    atk: GrowthGroup;
    def: GrowthGroup;
    spd: GrowthGroup;
  };
  perStatMultipliers: {                      // 스탯별 실제 배수 (개체차 포함)
    hp: number;
    atk: number;
    def: number;
    spd: number;
  };
}

export const generatePetGrowthInfo = (
  initialStats: BaseStats,
  statsRange: PetStatsRange
): PetGrowthInfo => {
  // 1. 기본 성장 그룹 롤 (확률 기반)
  const baseGroup = calculateGrowthGroup();

  // 2. 스탯별 천장 적용
  const perStatGroups = calculatePerStatGrowthGroups(baseGroup, initialStats, statsRange);

  // 3. 스탯별 실제 배수 결정 (각 그룹 범위 내 랜덤)
  const perStatMultipliers = {
    hp: getRandomGrowthMultiplier(perStatGroups.hp),
    atk: getRandomGrowthMultiplier(perStatGroups.atk),
    def: getRandomGrowthMultiplier(perStatGroups.def),
    spd: getRandomGrowthMultiplier(perStatGroups.spd),
  };

  return {
    baseGroup,
    perStatGroups,
    perStatMultipliers,
  };
};

/**
 * 레벨업 시 스탯 증가량 계산 (저장된 성장 정보 사용)
 *
 * @param baseGrowthRate - 종족 기준 성장률
 * @param growthInfo - 펫의 성장 정보 (생성 시 결정됨)
 * @returns 레벨업 스탯 증가량
 */
export const calculateLevelUpWithGrowthInfo = (
  baseGrowthRate: { hp: number; atk: number; def: number; spd: number },
  growthInfo: PetGrowthInfo
): { hp: number; atk: number; def: number; spd: number } => {
  const variance = () => 0.8 + Math.random() * 0.4;  // 0.8 ~ 1.2

  return {
    hp: Math.max(1, Math.floor(baseGrowthRate.hp * growthInfo.perStatMultipliers.hp * variance())),
    atk: Math.max(1, Math.floor(baseGrowthRate.atk * growthInfo.perStatMultipliers.atk * variance())),
    def: Math.max(1, Math.floor(baseGrowthRate.def * growthInfo.perStatMultipliers.def * variance())),
    spd: Math.max(1, Math.floor(baseGrowthRate.spd * growthInfo.perStatMultipliers.spd * variance())),
  };
};
