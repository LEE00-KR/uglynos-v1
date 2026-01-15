import type { BaseStats, DerivedStats, ElementType, WeaponType } from '../types/game.js';

/**
 * Calculate derived stats from base stats
 */
export const calculateDerivedStats = (
  baseStats: BaseStats,
  level: number
): DerivedStats => {
  return {
    maxHp: 100 + baseStats.vit * 10 + level * 5,
    maxMp: 50 + baseStats.int * 5 + level * 2,
    atk: 10 + baseStats.str * 2 + Math.floor(level * 1.5),
    def: 5 + baseStats.con * 2 + Math.floor(level * 0.8),
    spd: 10 + baseStats.agi * 2,
    eva: baseStats.agi * 0.3,
  };
};

/**
 * Experience required for level up
 */
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

/**
 * Calculate monster experience
 * Formula: Lv × (2 + Lv/20)
 */
export const calculateMonsterExp = (level: number, isBoss: boolean): number => {
  const base = level * (2 + level / 20);
  return Math.floor(isBoss ? base * 1.1 : base);
};

/**
 * Weapon accuracy by type
 */
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

/**
 * Weapon damage multiplier by type
 */
export const getWeaponMultiplier = (weaponType: WeaponType): number => {
  const multipliers: Record<WeaponType, number> = {
    sword: 1.5, // 150%
    club: 1.0, // 100%
    axe: 2.0, // 200%
    spear: 0.9, // 90% × 2
    claw: 0.4, // 40% × 3
    bow: 0.8, // 80% × random
  };
  return multipliers[weaponType];
};

/**
 * Weapon hit count by type
 */
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

/**
 * Weapon stat penalties
 */
export const getWeaponPenalty = (
  weaponType: WeaponType
): { agi: number; con: number } => {
  const penalties: Record<WeaponType, { agi: number; con: number }> = {
    sword: { agi: -10, con: 0 },
    club: { agi: 0, con: 0 },
    axe: { agi: -20, con: -20 },
    spear: { agi: -20, con: 0 },
    claw: { agi: 0, con: 0 },
    bow: { agi: 0, con: 0 },
  };
  return penalties[weaponType];
};

/**
 * Element advantage multiplier
 * Cycle: Earth → Wind → Fire → Water → Earth
 */
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

/**
 * Loyalty effects
 */
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

/**
 * Level difference loyalty penalty
 */
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

/**
 * Party experience bonus
 * 1 player: 100%, 2: 103%, 3: 106%, 4: 109%, 5: 120%
 */
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

/**
 * Level difference exp penalty
 */
export const getLevelPenalty = (levelDiff: number): number => {
  if (levelDiff <= 10) return 1.0;
  if (levelDiff <= 20) return 1.0 - (levelDiff - 10) * 0.005;
  if (levelDiff <= 30) return 0.95 - (levelDiff - 20) * 0.014;
  return 0.5;
};

/**
 * Durability loss calculation
 */
export const calculateDurabilityLoss = (
  isCriticalHit: boolean
): number => {
  const baseLoss = 0.5;
  return isCriticalHit ? baseLoss * 2 : baseLoss;
};

/**
 * Gang-up (multi-attack) critical bonus
 */
export const getGangUpCritBonus = (participantCount: number): number => {
  return Math.min((participantCount - 1) * 10, 50);
};

/**
 * Capture success rate calculation
 */
export const calculateCatchRate = (
  targetHpRatio: number,
  itemBonus: number = 0,
  luckBonus: number = 0
): number => {
  let rate = (1 - targetHpRatio) * 50 + 10; // 10~60% base
  rate += itemBonus;
  rate += luckBonus;
  return Math.min(rate, 95); // Max 95%
};

/**
 * Generate random pet stats on capture
 */
export const generateRandomPetStats = (): BaseStats => {
  return {
    str: 5 + Math.floor(Math.random() * 6),
    agi: 5 + Math.floor(Math.random() * 6),
    vit: 5 + Math.floor(Math.random() * 6),
    con: 5 + Math.floor(Math.random() * 6),
    int: 5 + Math.floor(Math.random() * 6),
  };
};

/**
 * Generate random pet growth rates (80-120%)
 */
export const generateRandomGrowthRates = () => {
  return {
    str: 80 + Math.floor(Math.random() * 41),
    agi: 80 + Math.floor(Math.random() * 41),
    vit: 80 + Math.floor(Math.random() * 41),
    con: 80 + Math.floor(Math.random() * 41),
    int: 80 + Math.floor(Math.random() * 41),
  };
};
