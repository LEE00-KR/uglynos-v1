import type { BattleUnit } from '../../types/game.js';

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

// 4스탯 시스템: HP, ATK, DEF, SPD
interface CapturedPetData {
  templateId: number;
  characterId: string;
  nickname: string | null;
  level: number;
  exp: number;
  stat_hp: number;
  stat_atk: number;
  stat_def: number;
  stat_spd: number;
  growth_hp: number;
  growth_atk: number;
  growth_def: number;
  growth_spd: number;
  loyalty: number;
  isRareColor: boolean;
  isStarter: boolean;
}

export class CaptureManager {
  /**
   * Attempt to capture a pet
   * - Only level 1 pets can be captured
   * - Base rate + modifiers
   */
  tryCatch(
    target: BattleUnit,
    _catcher: BattleUnit,
    captureItem?: CaptureItem
  ): CaptureResult {
    // Only level 1 capturable pets
    if (!target.isCapturable || target.level !== 1) {
      return { success: false, reason: 'not_capturable' };
    }

    // Base capture rate (HP ratio based)
    const hpRatio = target.hp / target.maxHp;
    let catchRate = (1 - hpRatio) * 50 + 10; // Lower HP = higher rate, 10~60%

    // Item bonus
    if (captureItem) {
      catchRate += captureItem.catchBonus;
    }

    // Hidden luck bonus (from equipment, titles, etc.)
    // TODO: Implement luck bonus from equipment

    // Max 95%
    catchRate = Math.min(catchRate, 95);

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
   * Create captured pet data
   */
  createCapturedPet(
    enemyUnit: BattleUnit,
    characterId: string
  ): CapturedPetData {
    const stats = this.generateRandomStats();
    const growthRates = this.generateGrowthRates();

    return {
      templateId: enemyUnit.templateId!,
      characterId,
      nickname: null,
      level: 1,
      exp: 0,
      ...stats,
      ...growthRates,
      loyalty: 50, // Initial loyalty
      isRareColor: enemyUnit.isRareColor || false,
      isStarter: false,
    };
  }

  /**
   * Generate random pet stats (4스탯 시스템)
   * HP: 10 + (0~10), ATK/DEF/SPD: 5 + (0~5)
   */
  private generateRandomStats() {
    return {
      stat_hp: 10 + Math.floor(Math.random() * 11),
      stat_atk: 5 + Math.floor(Math.random() * 6),
      stat_def: 5 + Math.floor(Math.random() * 6),
      stat_spd: 5 + Math.floor(Math.random() * 6),
    };
  }

  /**
   * Generate random growth rates (80~120%) - 4스탯 시스템
   */
  private generateGrowthRates() {
    return {
      growth_hp: 80 + Math.floor(Math.random() * 41),
      growth_atk: 80 + Math.floor(Math.random() * 41),
      growth_def: 80 + Math.floor(Math.random() * 41),
      growth_spd: 80 + Math.floor(Math.random() * 41),
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
  getEstimatedCatchRate(target: BattleUnit, itemBonus: number = 0): number {
    if (!target.isCapturable || target.level !== 1) {
      return 0;
    }

    const hpRatio = target.hp / target.maxHp;
    let rate = (1 - hpRatio) * 50 + 10;
    rate += itemBonus;
    return Math.min(Math.floor(rate), 95);
  }
}

export const captureManager = new CaptureManager();
