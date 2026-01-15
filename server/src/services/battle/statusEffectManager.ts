import type { BattleUnit, StatusEffectType, ElementType } from '../../types/game.js';

interface StatusEffectResult {
  type: StatusEffectType;
  damage?: number;
  message?: string;
}

interface StatusEffectConfig {
  name: string;
  preventsAction?: boolean;
  damageReduction?: number;
  actionChance?: number;
  spdReduction?: number;
  atkReduction?: number;
  accuracyReduction?: number;
  preventsSpells?: boolean;
  preventsSkills?: boolean;
  allowedActions?: string[];
  curedByElement?: ElementType;
  onTurnStart?: (unit: BattleUnit) => { type: string; value: number } | null;
}

export class StatusEffectManager {
  private static STATUS_EFFECTS: Record<StatusEffectType, StatusEffectConfig> = {
    poison: {
      name: '독',
      onTurnStart: (unit: BattleUnit) => {
        const damage = Math.floor(unit.maxHp * (0.05 + Math.random() * 0.05));
        return { type: 'damage', value: damage };
      },
    },
    petrify: {
      name: '석화',
      preventsAction: true,
      damageReduction: 0.2,
    },
    confusion: {
      name: '혼란',
    },
    freeze: {
      name: '동결',
      preventsAction: true,
      curedByElement: 'fire',
    },
    paralysis: {
      name: '마비',
      actionChance: 0.5,
      spdReduction: 0.3,
    },
    blind: {
      name: '실명',
      accuracyReduction: 0.3,
    },
    silence: {
      name: '침묵',
      preventsSpells: true,
      preventsSkills: true,
    },
    fear: {
      name: '공포',
      allowedActions: ['defend', 'flee'],
    },
    burn: {
      name: '화상',
      atkReduction: 0.2,
      onTurnStart: (unit: BattleUnit) => {
        const damage = Math.floor(unit.maxHp * (0.03 + Math.random() * 0.02));
        return { type: 'damage', value: damage };
      },
    },
  };

  /**
   * Try to apply status effect
   */
  tryApply(
    target: BattleUnit,
    statusType: StatusEffectType,
    isAoE: boolean = false
  ): { applied: boolean; reason?: string } {
    // Already has same status
    if (target.statusEffects.some((e) => e.type === statusType)) {
      return { applied: false, reason: 'already_affected' };
    }

    // Overwrite existing status
    if (target.statusEffects.length > 0) {
      target.statusEffects = [];
    }

    // Apply chance: Single 90%, AoE 80%
    const applyChance = isAoE ? 80 : 90;
    if (Math.random() * 100 > applyChance) {
      return { applied: false, reason: 'resisted' };
    }

    // Duration: 3~5 turns random
    const duration = 3 + Math.floor(Math.random() * 3);

    target.statusEffects.push({
      type: statusType,
      remainingTurns: duration,
      appliedAt: Date.now(),
    });

    return { applied: true };
  }

  /**
   * Process status effects at turn start
   */
  processTurnStart(unit: BattleUnit): StatusEffectResult[] {
    const results: StatusEffectResult[] = [];

    for (const effect of unit.statusEffects) {
      const config = StatusEffectManager.STATUS_EFFECTS[effect.type];

      if (config.onTurnStart) {
        const result = config.onTurnStart(unit);
        if (result) {
          results.push({
            type: effect.type,
            damage: result.value,
            message: `${unit.name}이(가) ${config.name}으로 ${result.value} 데미지를 받았다!`,
          });

          // Apply damage
          unit.hp = Math.max(0, unit.hp - result.value);
          if (unit.hp <= 0) {
            unit.isAlive = false;
          }
        }
      }
    }

    return results;
  }

  /**
   * Process status effects at turn end (decrease duration)
   */
  processTurnEnd(unit: BattleUnit): string[] {
    const expired: string[] = [];

    unit.statusEffects = unit.statusEffects.filter((effect) => {
      effect.remainingTurns--;

      if (effect.remainingTurns <= 0) {
        expired.push(effect.type);
        return false;
      }
      return true;
    });

    return expired;
  }

  /**
   * Check if element attack cures status
   */
  checkElementCure(unit: BattleUnit, attackElement: ElementType): string | null {
    const freezeEffect = unit.statusEffects.find((e) => e.type === 'freeze');
    if (freezeEffect && attackElement === 'fire') {
      unit.statusEffects = unit.statusEffects.filter((e) => e.type !== 'freeze');
      return 'freeze';
    }

    return null;
  }

  /**
   * Check if unit can act
   */
  canAct(unit: BattleUnit): { canAct: boolean; reason?: string } {
    for (const effect of unit.statusEffects) {
      const config = StatusEffectManager.STATUS_EFFECTS[effect.type];

      if (config.preventsAction) {
        return { canAct: false, reason: config.name };
      }

      if (config.actionChance && Math.random() > config.actionChance) {
        return { canAct: false, reason: config.name };
      }
    }

    return { canAct: true };
  }

  /**
   * Check if action is allowed
   */
  isActionAllowed(unit: BattleUnit, actionType: string): boolean {
    for (const effect of unit.statusEffects) {
      const config = StatusEffectManager.STATUS_EFFECTS[effect.type];

      if (config.allowedActions && !config.allowedActions.includes(actionType)) {
        return false;
      }

      if (config.preventsSpells && actionType === 'magic') {
        return false;
      }

      if (config.preventsSkills && actionType === 'skill') {
        return false;
      }
    }

    return true;
  }

  /**
   * Get modified target for confusion
   */
  getConfusionTarget(
    unit: BattleUnit,
    originalTarget: string,
    allies: string[],
    enemies: string[]
  ): string {
    const confusionEffect = unit.statusEffects.find((e) => e.type === 'confusion');
    if (!confusionEffect) return originalTarget;

    const roll = Math.random();
    if (roll < 0.33) return unit.id; // Self
    if (roll < 0.66) return enemies[Math.floor(Math.random() * enemies.length)];
    return allies[Math.floor(Math.random() * allies.length)];
  }

  /**
   * Get stat modifiers from status effects
   */
  getStatModifiers(unit: BattleUnit): {
    spdMod: number;
    atkMod: number;
    accuracyMod: number;
    defenseMod: number;
  } {
    let spdMod = 1.0;
    let atkMod = 1.0;
    let accuracyMod = 1.0;
    let defenseMod = 1.0;

    for (const effect of unit.statusEffects) {
      const config = StatusEffectManager.STATUS_EFFECTS[effect.type];

      if (config.spdReduction) spdMod -= config.spdReduction;
      if (config.atkReduction) atkMod -= config.atkReduction;
      if (config.accuracyReduction) accuracyMod -= config.accuracyReduction;
      if (config.damageReduction) defenseMod += config.damageReduction;
    }

    return { spdMod, atkMod, accuracyMod, defenseMod };
  }

  /**
   * Get status effect name
   */
  getStatusName(type: StatusEffectType): string {
    return StatusEffectManager.STATUS_EFFECTS[type]?.name || type;
  }
}

export const statusEffectManager = new StatusEffectManager();
