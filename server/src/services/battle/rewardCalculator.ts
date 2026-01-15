import type { BattleState, BattleRewards, ExpReward, DroppedItem } from '../../types/game.js';

interface DefeatedEnemy {
  id: string;
  level: number;
  isBoss: boolean;
  isCapturable: boolean;
  baseExp: number;
}

interface CharacterInfo {
  id: string;
  level: number;
}

interface StageTemplate {
  expReward: number;
  goldReward: number;
  drops: StageDrop[];
  star_condition_2_turns: number;
}

interface StageDrop {
  itemType: 'material' | 'equipment' | 'consumable';
  itemId: number;
  dropRate: number;
  quantityMin: number;
  quantityMax: number;
}

export class RewardCalculator {
  /**
   * Calculate battle rewards
   */
  calculateRewards(
    battleState: BattleState,
    stageInfo: StageTemplate,
    participants: CharacterInfo[],
    defeatedEnemies: DefeatedEnemy[]
  ): BattleRewards {
    // Calculate EXP
    const expRewards = this.calculateExp(defeatedEnemies, participants);

    // Gold reward
    const goldReward = stageInfo.goldReward;

    // Item drops
    const drops = this.rollDrops(stageInfo.drops);

    // Star rating
    const stars = this.calculateStars(battleState, stageInfo);

    return {
      exp: expRewards,
      gold: goldReward,
      drops,
      stars,
    };
  }

  /**
   * Calculate experience
   * - Only participating units get EXP
   * - Party bonus applied
   * - Level difference penalty applied
   */
  private calculateExp(
    enemies: DefeatedEnemy[],
    participants: CharacterInfo[]
  ): ExpReward[] {
    // Party member bonus
    const partyBonus = this.getPartyExpBonus(participants.length);

    // Total EXP from enemies
    let totalExp = 0;
    for (const enemy of enemies) {
      // Monster EXP = Lv × (2 + Lv/20)
      let exp = enemy.baseExp || enemy.level * (2 + enemy.level / 20);

      // Boss multiplier ×1.1
      if (enemy.isBoss) {
        exp *= 1.1;
      }

      // Level 1 capturable pet = 1 EXP
      if (enemy.level === 1 && enemy.isCapturable) {
        exp = 1;
      }

      totalExp += Math.floor(exp);
    }

    // Distribute EXP to participants
    return participants.map((char) => {
      let charExp = totalExp * partyBonus;

      // Level difference penalty
      const avgEnemyLevel =
        enemies.reduce((sum, e) => sum + e.level, 0) / enemies.length;
      const levelDiff = char.level - avgEnemyLevel;
      const penalty = this.getLevelPenalty(levelDiff);

      charExp *= penalty;

      return {
        characterId: char.id,
        exp: Math.floor(charExp),
      };
    });
  }

  /**
   * Party EXP bonus
   * 1 player: 100%, 2: 103%, 3: 106%, 4: 109%, 5: 120%
   */
  private getPartyExpBonus(memberCount: number): number {
    const bonuses: Record<number, number> = {
      1: 1.0,
      2: 1.03,
      3: 1.06,
      4: 1.09,
      5: 1.2,
    };
    return bonuses[memberCount] || 1.0;
  }

  /**
   * Level difference penalty
   * 1~10: none, 11~20: -1~5%, 21~30: -6~20%, 31+: -50%
   */
  private getLevelPenalty(levelDiff: number): number {
    if (levelDiff <= 10) return 1.0;
    if (levelDiff <= 20) return 1.0 - (levelDiff - 10) * 0.005;
    if (levelDiff <= 30) return 0.95 - (levelDiff - 20) * 0.014;
    return 0.5;
  }

  /**
   * Roll for item drops
   */
  private rollDrops(dropTable: StageDrop[]): DroppedItem[] {
    const drops: DroppedItem[] = [];

    for (const drop of dropTable) {
      const roll = Math.random() * 100;

      if (roll < drop.dropRate) {
        const quantity =
          drop.quantityMin +
          Math.floor(Math.random() * (drop.quantityMax - drop.quantityMin + 1));

        drops.push({
          itemType: drop.itemType,
          itemId: drop.itemId,
          quantity,
        });
      }
    }

    return drops;
  }

  /**
   * Calculate star rating
   * ⭐1: All allies survive
   * ⭐2: Clear within N turns
   * ⭐3: Special condition
   */
  private calculateStars(
    battleState: BattleState,
    stageInfo: StageTemplate
  ): number {
    let stars = 0;

    // ⭐1: All allies survive
    const allAlliesAlive = Array.from(battleState.units.values())
      .filter((u) => u.type !== 'enemy')
      .every((u) => u.isAlive);
    if (allAlliesAlive) stars++;

    // ⭐2: Clear within N turns
    if (battleState.turnNumber <= stageInfo.star_condition_2_turns) {
      stars++;
    }

    // ⭐3: Special condition (stage-specific)
    // For now, grant if both previous conditions are met
    if (stars === 2) {
      stars++;
    }

    return stars;
  }

  /**
   * Calculate gold bonus from enemies
   */
  calculateGoldBonus(enemies: DefeatedEnemy[]): number {
    let bonus = 0;
    for (const enemy of enemies) {
      bonus += enemy.level * 2;
      if (enemy.isBoss) {
        bonus += enemy.level * 5;
      }
    }
    return bonus;
  }

  /**
   * Apply EXP to character and check level up
   */
  applyExp(
    currentLevel: number,
    currentExp: number,
    gainedExp: number
  ): { newLevel: number; newExp: number; leveledUp: boolean; levelsGained: number } {
    let level = currentLevel;
    let exp = currentExp + gainedExp;
    let levelsGained = 0;

    // Check for level ups
    while (exp >= this.getRequiredExp(level)) {
      exp -= this.getRequiredExp(level);
      level++;
      levelsGained++;
    }

    return {
      newLevel: level,
      newExp: exp,
      leveledUp: levelsGained > 0,
      levelsGained,
    };
  }

  /**
   * Get required EXP for level up
   */
  private getRequiredExp(level: number): number {
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
  }
}

export const rewardCalculator = new RewardCalculator();
