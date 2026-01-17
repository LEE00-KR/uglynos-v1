/**
 * 몬스터/펫 성장률 시스템 설정
 */

// ============================================
// 성장 그룹 설정 (80~100% 범위, 정규분포 확률)
// ============================================
export const GROWTH_GROUPS = {
  S: { multiplier: 1.0, probability: 5, stars: 3, color: '#FFD700' },   // 100%, 5%
  A: { multiplier: 0.95, probability: 20, stars: 2, color: '#C0C0C0' }, // 95%, 20%
  B: { multiplier: 0.9, probability: 50, stars: 1, color: '#CD7F32' },  // 90%, 50%
  C: { multiplier: 0.85, probability: 20, stars: 0, color: '#808080' }, // 85%, 20%
  D: { multiplier: 0.8, probability: 5, stars: 0, color: '#404040' },   // 80%, 5%
} as const;

export type GrowthGroup = keyof typeof GROWTH_GROUPS;

// 정규분포 기반 성장 그룹 랜덤 선택
export const rollGrowthGroup = (): GrowthGroup => {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [group, config] of Object.entries(GROWTH_GROUPS)) {
    cumulative += config.probability;
    if (roll < cumulative) {
      return group as GrowthGroup;
    }
  }
  return 'B'; // fallback
};

// ============================================
// 스탯 제한 설정
// ============================================
export const STAT_LIMITS = {
  initial: {
    hp: { min: 1, max: 100 },
    atk: { min: 1, max: 20 },
    def: { min: 1, max: 20 },
    spd: { min: 1, max: 20 },
  },
  growth: {
    hp: { min: 1.0, max: 30.0 },
    atk: { min: 1.0, max: 3.0 },
    def: { min: 1.0, max: 3.0 },
    spd: { min: 1.0, max: 3.0 },
  },
} as const;

// ============================================
// 속성 설정
// ============================================
export const ELEMENTS = ['earth', 'water', 'fire', 'wind'] as const;
export type Element = (typeof ELEMENTS)[number];

export const ELEMENT_ADVANTAGE: Record<Element, { strong: Element; weak: Element }> = {
  earth: { strong: 'water', weak: 'wind' },
  water: { strong: 'fire', weak: 'earth' },
  fire: { strong: 'wind', weak: 'water' },
  wind: { strong: 'earth', weak: 'fire' },
};

export const ELEMENT_EMOJI: Record<Element, string> = {
  earth: '🌍',
  water: '💧',
  fire: '🔥',
  wind: '🌪️',
};

// ============================================
// 게임 설정
// ============================================
export const MAX_LEVEL = 99;
export const LEVELUP_VARIANCE = { min: 0.8, max: 1.2 }; // ±20% 변동

// ============================================
// 희귀도 설정
// ============================================
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const RARITY_BONUS_POOL: Record<Rarity, { min: number; max: number }> = {
  common: { min: 0, max: 5 },
  uncommon: { min: 2, max: 8 },
  rare: { min: 5, max: 12 },
  epic: { min: 8, max: 18 },
  legendary: { min: 12, max: 25 },
};

// ============================================
// 경험치 테이블
// ============================================
export const getRequiredExpForLevel = (level: number): number => {
  if (level < 1) return 0;
  if (level >= MAX_LEVEL) return Infinity;

  // 1~4레벨: 고정값
  const earlyLevels: Record<number, number> = {
    1: 10,
    2: 25,
    3: 50,
    4: 100,
  };

  if (earlyLevels[level]) {
    return earlyLevels[level];
  }

  // 5레벨 이상: 지수 증가
  if (level < 30) {
    return Math.floor(100 * Math.pow(1.12, level - 4));
  } else if (level < 70) {
    return Math.floor(100 * Math.pow(1.12, 26) * Math.pow(1.15, level - 30));
  } else {
    return Math.floor(100 * Math.pow(1.12, 26) * Math.pow(1.15, 40) * Math.pow(1.2, level - 70));
  }
};
