import type { BattleUnit } from '../../types/game.js';
import {
  generateRandomGrowthRates,
  calculateGrowthGroup,
  calculateCatchRate,
  type GrowthGroup,
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

// 4스탯 기반 포획 펫 데이터
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
  // 성장률 (4스탯)
  growth_hp: number;
  growth_atk: number;
  growth_def: number;
  growth_spd: number;
  // 성장 그룹
  growthGroup: GrowthGroup;
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
   */
  createCapturedPet(
    enemyUnit: BattleUnit,
    characterId: string
  ): CapturedPetData {
    // Use enemy unit's stats directly
    const baseStats = enemyUnit.stats;

    // Generate random growth rates (4스탯)
    const growthRates = generateRandomGrowthRates({
      hp: { min: 5.0, max: 10.0 },
      atk: { min: 1.0, max: 2.0 },
      def: { min: 1.0, max: 2.0 },
      spd: { min: 1.0, max: 2.0 },
    });

    // Calculate growth group based on stats
    const growthGroup = calculateGrowthGroup(baseStats);

    return {
      templateId: enemyUnit.templateId || '',
      characterId,
      nickname: null,
      level: 1,
      exp: 0,
      stat_hp: baseStats.hp,
      stat_atk: baseStats.atk,
      stat_def: baseStats.def,
      stat_spd: baseStats.spd,
      growth_hp: growthRates.hp,
      growth_atk: growthRates.atk,
      growth_def: growthRates.def,
      growth_spd: growthRates.spd,
      growthGroup,
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
