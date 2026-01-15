import type { BattleUnit } from '../../types/game.js';

interface DisobeyResult {
  disobeyed: boolean;
  action?: string;
  message?: string;
}

export class LoyaltyManager {
  /**
   * Check if pet disobeys command
   */
  checkDisobey(pet: BattleUnit): DisobeyResult {
    const loyalty = pet.loyalty || 100;

    // Calculate disobey chance
    let disobeyChance = 0;
    if (loyalty >= 100) disobeyChance = 0;
    else if (loyalty >= 70) disobeyChance = 5;
    else if (loyalty >= 50) disobeyChance = 15;
    else if (loyalty >= 30) disobeyChance = 30;
    else disobeyChance = 50;

    const disobeys = Math.random() * 100 < disobeyChance;

    if (!disobeys) {
      return { disobeyed: false };
    }

    // Determine disobey action
    const actions = ['idle', 'attack_random', 'defend'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    return {
      disobeyed: true,
      action,
      message: this.getDisobeyMessage(pet.name, action),
    };
  }

  /**
   * Check if pet runs away (loyalty <= 30)
   */
  checkRunaway(pet: BattleUnit): boolean {
    const loyalty = pet.loyalty || 100;

    if (loyalty > 30) return false;

    // Loyalty 30 or below: can run away during battle
    const runawayChance = (30 - loyalty) * 2; // Max 60%
    return Math.random() * 100 < runawayChance;
  }

  /**
   * Update loyalty after battle
   */
  updateLoyaltyAfterBattle(
    pet: BattleUnit,
    result: 'victory' | 'defeat',
    wasKnockedOut: boolean
  ): number {
    const currentLoyalty = pet.loyalty || 50;
    let change = 0;

    if (result === 'victory') {
      change = Math.floor(Math.random() * 2) + 1; // +1~2
    }

    if (wasKnockedOut) {
      change -= 5; // -5 if knocked out
    }

    const newLoyalty = Math.max(0, Math.min(100, currentLoyalty + change));
    return newLoyalty;
  }

  /**
   * Apply level difference decay
   */
  applyLevelDifferenceDecay(pet: BattleUnit, characterLevel: number): number {
    const currentLoyalty = pet.loyalty || 50;
    const levelDiff = pet.level - characterLevel;

    if (levelDiff <= 0) return currentLoyalty;

    let decayPercent = 0;
    if (levelDiff >= 20) decayPercent = 50;
    else if (levelDiff >= 10) decayPercent = 20;
    else if (levelDiff >= 5) decayPercent = 10;

    return Math.floor(currentLoyalty * (1 - decayPercent / 100));
  }

  /**
   * Get loyalty effects
   */
  getLoyaltyEffects(loyalty: number) {
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
  }

  /**
   * Get loyalty tier description
   */
  getLoyaltyTier(loyalty: number): string {
    if (loyalty >= 100) return '최상';
    if (loyalty >= 70) return '좋음';
    if (loyalty >= 50) return '보통';
    if (loyalty >= 30) return '나쁨';
    return '최악';
  }

  /**
   * Calculate loyalty change from feeding
   */
  calculateFeedingBonus(itemQuality: number): number {
    // Item quality: 1 (low) ~ 5 (high)
    return itemQuality * 2; // +2 ~ +10
  }

  private getDisobeyMessage(petName: string, action: string): string {
    const messages: Record<string, string> = {
      idle: `${petName}이(가) 멍하니 서있다...`,
      attack_random: `${petName}이(가) 마음대로 공격했다!`,
      defend: `${petName}이(가) 방어 자세를 취했다.`,
    };
    return messages[action] || `${petName}이(가) 명령을 따르지 않았다.`;
  }
}

export const loyaltyManager = new LoyaltyManager();
