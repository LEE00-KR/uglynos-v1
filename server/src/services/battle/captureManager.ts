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

interface CapturedPetData {
  templateId: number;
  characterId: string;
  nickname: string | null;
  level: number;
  exp: number;
  stat_str: number;
  stat_agi: number;
  stat_vit: number;
  stat_con: number;
  stat_int: number;
  growth_str: number;
  growth_agi: number;
  growth_vit: number;
  growth_con: number;
  growth_int: number;
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
   * Generate random pet stats
   * Each stat: 5 + (0~5) random
   */
  private generateRandomStats() {
    return {
      stat_str: 5 + Math.floor(Math.random() * 6),
      stat_agi: 5 + Math.floor(Math.random() * 6),
      stat_vit: 5 + Math.floor(Math.random() * 6),
      stat_con: 5 + Math.floor(Math.random() * 6),
      stat_int: 5 + Math.floor(Math.random() * 6),
    };
  }

  /**
   * Generate random growth rates (80~120%)
   */
  private generateGrowthRates() {
    return {
      growth_str: 80 + Math.floor(Math.random() * 41),
      growth_agi: 80 + Math.floor(Math.random() * 41),
      growth_vit: 80 + Math.floor(Math.random() * 41),
      growth_con: 80 + Math.floor(Math.random() * 41),
      growth_int: 80 + Math.floor(Math.random() * 41),
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
