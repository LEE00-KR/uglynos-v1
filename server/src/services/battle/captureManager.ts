import type { BattleUnit, PetGrowthInfo } from '../../types/game.js';
import {
  calculateCatchRate,
  generatePetGrowthInfo,
  type PetStatsRange,
} from '../../utils/formulas.js';

interface CaptureItem {
  catchBonus: number;
}

interface CaptureResult {
  success: boolean;
  catchRate?: number;
  roll?: number;
  isRareColor?: boolean;
  reason?: string;
}

// 4스탯 기반 포획 펫 데이터 (성장 그룹 비공개)
interface CapturedPetData {
  templateId: string;  // string으로 변경 (admin_pets.id)
  characterId: string;
  nickname: string | null;
  level: number;
  exp: number;
  // 4스탯
  stat_hp: number;
  stat_atk: number;
  stat_def: number;
  stat_spd: number;
  // 성장률 (종족 기준값)
  growth_hp: number;
  growth_atk: number;
  growth_def: number;
  growth_spd: number;
  // 성장 정보 (내부용, 유저 비공개)
  growthInfo: PetGrowthInfo;
  loyalty: number;
  isRareColor: boolean;
}

export class CaptureManager {
  /**
   * Attempt to capture a pet
   * - Only level 1 pets can be captured
   * - 기본 5%, HP/레벨에 따라 증가
   */
  tryCatch(
    target: BattleUnit,
    catcher: BattleUnit,
    captureItem?: CaptureItem
  ): CaptureResult {
    if (!target.isCapturable || target.level !== 1) {
      return { success: false, reason: 'not_capturable' };
    }

    // HP 비율
    const hpRatio = target.hp / target.maxHp;

    // 아이템 보너스
    const itemBonus = captureItem?.catchBonus || 0;

    // 포획률 계산 (HP + 캐릭터 레벨 + 아이템)
    const catchRate = calculateCatchRate(hpRatio, catcher.level, itemBonus);

    const roll = Math.random() * 100;
    const success = roll < catchRate;

    return {
      success,
      catchRate,
      roll,
      isRareColor: target.isRareColor,
    };
  }

  /**
   * Create captured pet data from BattleUnit (4스탯)
   * ISG 기반 성장 시스템 적용
   *
   * @param enemyUnit - 포획 대상 유닛
   * @param characterId - 포획자 캐릭터 ID
   * @param statsRange - 종족 스탯 범위 (템플릿에서 가져옴)
   * @param baseGrowthRates - 종족 기준 성장률 (템플릿에서 가져옴)
   */
  createCapturedPet(
    enemyUnit: BattleUnit,
    characterId: string,
    statsRange?: PetStatsRange,
    baseGrowthRates?: { hp: number; atk: number; def: number; spd: number }
  ): CapturedPetData {
    // Use enemy unit's stats directly (포획 시 이미 결정된 초기 스탯)
    const initialStats = enemyUnit.stats;

    // 기본값 설정 (템플릿 정보 없을 경우)
    const defaultStatsRange: PetStatsRange = statsRange || {
      hp: { min: initialStats.hp - 10, base: initialStats.hp, max: initialStats.hp + 10 },
      atk: { min: initialStats.atk - 2, base: initialStats.atk, max: initialStats.atk + 2 },
      def: { min: initialStats.def - 2, base: initialStats.def, max: initialStats.def + 2 },
      spd: { min: initialStats.spd - 2, base: initialStats.spd, max: initialStats.spd + 2 },
    };

    const defaultGrowthRates = baseGrowthRates || {
      hp: 7.5, atk: 1.5, def: 1.5, spd: 1.5,
    };

    // ISG 기반 성장 정보 생성 (초기 스탯 → 천장 + 확률 → 스탯별 성장 그룹)
    const growthInfo = generatePetGrowthInfo(initialStats, defaultStatsRange);

    return {
      templateId: enemyUnit.templateId || '',
      characterId,
      nickname: null,
      level: 1,
      exp: 0,
      stat_hp: initialStats.hp,
      stat_atk: initialStats.atk,
      stat_def: initialStats.def,
      stat_spd: initialStats.spd,
      growth_hp: defaultGrowthRates.hp,
      growth_atk: defaultGrowthRates.atk,
      growth_def: defaultGrowthRates.def,
      growth_spd: defaultGrowthRates.spd,
      growthInfo,  // 내부용 성장 정보 (유저에게 비공개)
      loyalty: 50,
      isRareColor: enemyUnit.isRareColor || false,
    };
  }

  /**
   * Check if target can be captured
   */
  canCapture(target: BattleUnit): { canCapture: boolean; reason?: string } {
    if (!target.isCapturable) {
      return { canCapture: false, reason: 'not_capturable' };
    }

    if (target.level !== 1) {
      return { canCapture: false, reason: 'level_too_high' };
    }

    if (!target.isAlive) {
      return { canCapture: false, reason: 'target_dead' };
    }

    return { canCapture: true };
  }

  /**
   * Calculate capture rate display (for UI)
   */
  getEstimatedCatchRate(
    target: BattleUnit,
    catcherLevel: number = 1,
    itemBonus: number = 0
  ): number {
    if (!target.isCapturable || target.level !== 1) {
      return 0;
    }

    const hpRatio = target.hp / target.maxHp;
    return calculateCatchRate(hpRatio, catcherLevel, itemBonus);
  }
}

export const captureManager = new CaptureManager();
