/**
 * 몬스터/펫 성장률 시스템 유틸리티 함수
 */

import { GROWTH_GROUPS, LEVELUP_VARIANCE, type GrowthGroup } from '../config/monster.js';
import type {
  StatBlock,
  StatRange,
  MonsterSpecies,
  MonsterInstance,
  LevelUpResult,
} from '../types/monster.js';

// ============================================
// 랜덤 유틸리티
// ============================================
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ============================================
// 기본 초기치 생성
// ============================================
export function generateBaseStats(species: MonsterSpecies): StatBlock {
  return {
    hp: randomInt(species.baseStats.hp.min, species.baseStats.hp.max),
    atk: randomInt(species.baseStats.atk.min, species.baseStats.atk.max),
    def: randomInt(species.baseStats.def.min, species.baseStats.def.max),
    spd: randomInt(species.baseStats.spd.min, species.baseStats.spd.max),
  };
}

// ============================================
// 보너스 스탯 생성
// ============================================
export function generateBonusStats(species: MonsterSpecies): StatBlock {
  const totalBonus = randomInt(species.bonusPool.min, species.bonusPool.max);

  const bonus: StatBlock = { hp: 0, atk: 0, def: 0, spd: 0 };
  let remaining = totalBonus;

  // 랜덤 분배 (HP에는 더 많이 분배될 수 있음)
  const stats: (keyof StatBlock)[] = ['hp', 'atk', 'def', 'spd'];
  const weights = { hp: 3, atk: 2, def: 2, spd: 2 }; // HP에 가중치

  while (remaining > 0) {
    const weightedStats: (keyof StatBlock)[] = [];
    for (const stat of stats) {
      for (let i = 0; i < weights[stat]; i++) {
        weightedStats.push(stat);
      }
    }
    const stat = weightedStats[randomInt(0, weightedStats.length - 1)];
    bonus[stat]++;
    remaining--;
  }

  return bonus;
}

// ============================================
// 성장 그룹 결정 (핵심!)
// ============================================
export function determineGrowthGroup(baseStats: StatBlock, species: MonsterSpecies): GrowthGroup {
  // 기본 초기치 합계 (HP 제외, 전투 스탯만)
  const baseSum = baseStats.atk + baseStats.def + baseStats.spd;

  // 최대 기본 초기치 합계
  const maxSum =
    species.baseStats.atk.max + species.baseStats.def.max + species.baseStats.spd.max;

  // 비율 계산 (%)
  const ratio = (baseSum / maxSum) * 100;

  // 그룹 결정
  if (ratio >= GROWTH_GROUPS.S.ratioMin) return 'S';
  if (ratio >= GROWTH_GROUPS.A.ratioMin) return 'A';
  if (ratio >= GROWTH_GROUPS.B.ratioMin) return 'B';
  if (ratio >= GROWTH_GROUPS.C.ratioMin) return 'C';
  return 'D';
}

// ============================================
// 성장률 범위 계산 (그룹 배율 적용)
// ============================================
export function calculateGrowthRates(
  species: MonsterSpecies,
  growthGroup: GrowthGroup
): { hp: StatRange; atk: StatRange; def: StatRange; spd: StatRange } {
  const multiplier = GROWTH_GROUPS[growthGroup].multiplier;

  return {
    hp: {
      min: species.growthRates.hp.min * multiplier,
      max: species.growthRates.hp.max * multiplier,
    },
    atk: {
      min: species.growthRates.atk.min * multiplier,
      max: species.growthRates.atk.max * multiplier,
    },
    def: {
      min: species.growthRates.def.min * multiplier,
      max: species.growthRates.def.max * multiplier,
    },
    spd: {
      min: species.growthRates.spd.min * multiplier,
      max: species.growthRates.spd.max * multiplier,
    },
  };
}

// ============================================
// 레벨업 스탯 증가량 계산
// ============================================
export function calculateLevelUpIncrease(growthRange: StatRange): number {
  // 1. 성장률 범위 내 랜덤
  const randomFactor = Math.random();
  const baseGrowth = growthRange.min + (growthRange.max - growthRange.min) * randomFactor;

  // 2. 변동 계수 적용 (±20%)
  const variance = randomFloat(LEVELUP_VARIANCE.min, LEVELUP_VARIANCE.max);

  return baseGrowth * variance;
}

// ============================================
// 레벨업 처리
// ============================================
export function processLevelUp(monster: MonsterInstance): LevelUpResult {
  const previousLevel = monster.level;

  // 각 스탯별 증가량 계산
  const hpIncrease = calculateLevelUpIncrease(monster.growthRates.hp);
  const atkIncrease = calculateLevelUpIncrease(monster.growthRates.atk);
  const defIncrease = calculateLevelUpIncrease(monster.growthRates.def);
  const spdIncrease = calculateLevelUpIncrease(monster.growthRates.spd);

  const statIncreases: StatBlock = {
    hp: hpIncrease,
    atk: atkIncrease,
    def: defIncrease,
    spd: spdIncrease,
  };

  // 스탯 증가
  monster.currentStats.hp += hpIncrease;
  monster.currentStats.atk += atkIncrease;
  monster.currentStats.def += defIncrease;
  monster.currentStats.spd += spdIncrease;

  // 성장 기록 추가
  monster.growthHistory.hp.push(hpIncrease);
  monster.growthHistory.atk.push(atkIncrease);
  monster.growthHistory.def.push(defIncrease);
  monster.growthHistory.spd.push(spdIncrease);

  // 레벨 증가
  monster.level++;

  // 현재 HP 회복 (최대 HP 증가분만큼)
  monster.currentHp = Math.floor(monster.currentStats.hp);

  return {
    previousLevel,
    newLevel: monster.level,
    statIncreases,
    newStats: {
      hp: Math.floor(monster.currentStats.hp),
      atk: Math.floor(monster.currentStats.atk),
      def: Math.floor(monster.currentStats.def),
      spd: Math.floor(monster.currentStats.spd),
    },
  };
}

// ============================================
// 평균 성장률 계산 (표시용)
// ============================================
export function calculateAverageGrowthRates(history: {
  hp: number[];
  atk: number[];
  def: number[];
  spd: number[];
}): { hp: number; atk: number; def: number; spd: number; total: number } {
  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const hp = avg(history.hp);
  const atk = avg(history.atk);
  const def = avg(history.def);
  const spd = avg(history.spd);

  return {
    hp: Math.round(hp * 100) / 100,
    atk: Math.round(atk * 100) / 100,
    def: Math.round(def * 100) / 100,
    spd: Math.round(spd * 100) / 100,
    total: Math.round((atk + def + spd) * 100) / 100,
  };
}

// ============================================
// 예상 성장률 계산 (레벨업 전 표시용)
// ============================================
export function getExpectedGrowthRates(growthRates: {
  hp: StatRange;
  atk: StatRange;
  def: StatRange;
  spd: StatRange;
}): { hp: number; atk: number; def: number; spd: number; total: number } {
  const avg = (range: StatRange) => (range.min + range.max) / 2;

  const hp = avg(growthRates.hp);
  const atk = avg(growthRates.atk);
  const def = avg(growthRates.def);
  const spd = avg(growthRates.spd);

  return {
    hp: Math.round(hp * 100) / 100,
    atk: Math.round(atk * 100) / 100,
    def: Math.round(def * 100) / 100,
    spd: Math.round(spd * 100) / 100,
    total: Math.round((atk + def + spd) * 100) / 100,
  };
}

// ============================================
// 종족 템플릿에서 Species 객체 변환
// ============================================
export function templateToSpecies(template: {
  id: number;
  name: string;
  description: string;
  element_primary: string;
  element_secondary: string | null;
  element_primary_ratio: number;
  rarity: string;
  base_hp_min: number;
  base_hp_max: number;
  base_atk_min: number;
  base_atk_max: number;
  base_def_min: number;
  base_def_max: number;
  base_spd_min: number;
  base_spd_max: number;
  bonus_pool_min: number;
  bonus_pool_max: number;
  growth_hp_min: number;
  growth_hp_max: number;
  growth_atk_min: number;
  growth_atk_max: number;
  growth_def_min: number;
  growth_def_max: number;
  growth_spd_min: number;
  growth_spd_max: number;
  max_level: number;
  evolution_id: number | null;
  image_url: string | null;
}): MonsterSpecies {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    element: template.element_primary as MonsterSpecies['element'],
    secondaryElement: template.element_secondary as MonsterSpecies['element'] | undefined,
    elementRatio: template.element_primary_ratio,
    rarity: template.rarity as MonsterSpecies['rarity'],
    baseStats: {
      hp: { min: template.base_hp_min, max: template.base_hp_max },
      atk: { min: template.base_atk_min, max: template.base_atk_max },
      def: { min: template.base_def_min, max: template.base_def_max },
      spd: { min: template.base_spd_min, max: template.base_spd_max },
    },
    bonusPool: { min: template.bonus_pool_min, max: template.bonus_pool_max },
    growthRates: {
      hp: { min: template.growth_hp_min, max: template.growth_hp_max },
      atk: { min: template.growth_atk_min, max: template.growth_atk_max },
      def: { min: template.growth_def_min, max: template.growth_def_max },
      spd: { min: template.growth_spd_min, max: template.growth_spd_max },
    },
    maxLevel: template.max_level,
    evolutionId: template.evolution_id ?? undefined,
    imageUrl: template.image_url ?? undefined,
  };
}

// ============================================
// 초기 MP 계산
// ============================================
export function calculateMaxMp(level: number, baseInt: number = 10): number {
  return 50 + baseInt * 5 + level * 2;
}
