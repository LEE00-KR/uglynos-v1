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
// 템플릿의 범위 내에서 랜덤 생성
// =====================================================
export interface StatRange {
  min: number;
  max: number;
}

export interface PetStatsRange {
  hp: StatRange;
  atk: StatRange;
  def: StatRange;
  spd: StatRange;
}

export interface PetBonusPool {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export const generateRandomPetStats = (
  baseStatsRange: PetStatsRange,
  bonusPool: PetBonusPool
): BaseStats => {
  // 기본 스탯 랜덤 생성
  const baseHp = Math.floor(
    Math.random() * (baseStatsRange.hp.max - baseStatsRange.hp.min + 1) +
      baseStatsRange.hp.min
  );
  const baseAtk = Math.floor(
    Math.random() * (baseStatsRange.atk.max - baseStatsRange.atk.min + 1) +
      baseStatsRange.atk.min
  );
  const baseDef = Math.floor(
    Math.random() * (baseStatsRange.def.max - baseStatsRange.def.min + 1) +
      baseStatsRange.def.min
  );
  const baseSpd = Math.floor(
    Math.random() * (baseStatsRange.spd.max - baseStatsRange.spd.min + 1) +
      baseStatsRange.spd.min
  );

  // 보너스 풀에서 랜덤 분배
  const bonusHp = Math.floor(Math.random() * (bonusPool.hp + 1));
  const bonusAtk = Math.floor(Math.random() * (bonusPool.atk + 1));
  const bonusDef = Math.floor(Math.random() * (bonusPool.def + 1));
  const bonusSpd = Math.floor(Math.random() * (bonusPool.spd + 1));

  return {
    hp: baseHp + bonusHp,
    atk: baseAtk + bonusAtk,
    def: baseDef + bonusDef,
    spd: baseSpd + bonusSpd,
  };
};

// =====================================================
// 랜덤 성장률 생성 (4스탯)
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
// 성장 그룹 계산
// 총합 스탯 기반
// =====================================================
export type GrowthGroup = 'S' | 'A' | 'B' | 'C' | 'D';

export const GROWTH_GROUP_CONFIG = {
  S: { minPercent: 95, maxPercent: 100, multiplier: 1.0 },
  A: { minPercent: 85, maxPercent: 94, multiplier: 0.9 },
  B: { minPercent: 70, maxPercent: 84, multiplier: 0.8 },
  C: { minPercent: 50, maxPercent: 69, multiplier: 0.7 },
  D: { minPercent: 0, maxPercent: 49, multiplier: 0.6 },
} as const;

// 최대 총합 스탯 (기준점)
export const MAX_TOTAL_STATS = 1299;  // HP(999) + ATK(100) + DEF(100) + SPD(100)

export const calculateGrowthGroup = (
  stats: BaseStats,
  maxPossibleStats: number = MAX_TOTAL_STATS
): GrowthGroup => {
  const totalStats = stats.hp + stats.atk + stats.def + stats.spd;
  const percent = (totalStats / maxPossibleStats) * 100;

  if (percent >= 95) return 'S';
  if (percent >= 85) return 'A';
  if (percent >= 70) return 'B';
  if (percent >= 50) return 'C';
  return 'D';
};

export const getGrowthMultiplier = (group: GrowthGroup): number => {
  return GROWTH_GROUP_CONFIG[group].multiplier;
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
