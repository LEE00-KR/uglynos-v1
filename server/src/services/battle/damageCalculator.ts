import type {
  BattleUnit,
  ElementInfo,
  EquipmentInfo,
  DamageResult,
  ElementType,
} from '../../types/game.js';
import type { StatusEffect } from '../../types/game.js';

interface DamageOptions {
  weaponInfo?: EquipmentInfo;
  attackElement?: ElementInfo;
  critChance?: number;
  gangUpBonus?: number;
  isSkill?: boolean;
  skillDamageRatio?: number;
}

export class DamageCalculator {
  private static ELEMENT_ADVANTAGE: Record<ElementType, ElementType> = {
    earth: 'wind',
    wind: 'fire',
    fire: 'water',
    water: 'earth',
  };

  private static ELEMENT_DISADVANTAGE: Record<ElementType, ElementType> = {
    earth: 'water',
    wind: 'earth',
    fire: 'wind',
    water: 'fire',
  };

  private static STATUS_WEAKNESS: Record<string, ElementType> = {
    poison: 'fire',
    petrify: 'wind',
    paralysis: 'earth',
    burn: 'water',
  };

  /**
   * Main damage calculation
   */
  calculate(
    attacker: BattleUnit,
    defender: BattleUnit,
    options: DamageOptions = {}
  ): DamageResult {
    // Step 1: Base damage (ATK)
    let baseDamage = attacker.stats.atk;

    // Skill damage ratio
    if (options.isSkill && options.skillDamageRatio) {
      baseDamage = Math.floor(baseDamage * (options.skillDamageRatio / 100));
    }

    // Step 2: Weapon multiplier
    if (options.weaponInfo) {
      baseDamage = Math.floor(baseDamage * (options.weaponInfo.attackRatio / 100));
    }

    // Step 3: Element multiplier
    const attackElement = options.attackElement || attacker.element;
    const elementMultiplier = this.calculateElementMultiplier(
      attackElement,
      defender.element
    );
    baseDamage = Math.floor(baseDamage * elementMultiplier);

    // Step 4: Critical check
    let critChance = options.critChance || 5;
    if (options.gangUpBonus) {
      critChance += options.gangUpBonus;
    }
    const isCritical = this.rollCritical(critChance);

    // Step 5: Apply defense (critical ignores defense)
    let finalDamage = baseDamage;
    if (!isCritical) {
      finalDamage = Math.max(1, baseDamage - defender.stats.def);
    }

    // Step 6: Defending state (50% damage reduction)
    if (defender.isDefending) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }

    // Step 7: Status weakness multiplier
    const statusWeaknessMultiplier = this.getStatusWeaknessMultiplier(
      defender.statusEffects,
      attackElement
    );
    finalDamage = Math.floor(finalDamage * statusWeaknessMultiplier);

    // Minimum 1 damage
    finalDamage = Math.max(1, Math.round(finalDamage));

    return {
      damage: finalDamage,
      isCritical,
      elementMultiplier,
      statusWeaknessMultiplier,
      wasDefending: defender.isDefending,
    };
  }

  /**
   * Calculate element multiplier for compound elements
   */
  private calculateElementMultiplier(
    attackElement: ElementInfo,
    defenderElement: ElementInfo
  ): number {
    const attackPrimaryRatio = attackElement.primaryRatio / 100;
    const attackSecondaryRatio = attackElement.secondary
      ? (100 - attackElement.primaryRatio) / 100
      : 0;

    const defPrimaryRatio = defenderElement.primaryRatio / 100;
    const defSecondaryRatio = defenderElement.secondary
      ? (100 - defenderElement.primaryRatio) / 100
      : 0;

    const combinations = [
      {
        atk: attackElement.primary,
        def: defenderElement.primary,
        ratio: attackPrimaryRatio * defPrimaryRatio,
      },
      {
        atk: attackElement.primary,
        def: defenderElement.secondary,
        ratio: attackPrimaryRatio * defSecondaryRatio,
      },
      {
        atk: attackElement.secondary,
        def: defenderElement.primary,
        ratio: attackSecondaryRatio * defPrimaryRatio,
      },
      {
        atk: attackElement.secondary,
        def: defenderElement.secondary,
        ratio: attackSecondaryRatio * defSecondaryRatio,
      },
    ];

    let totalMultiplier = 0;

    for (const combo of combinations) {
      if (!combo.atk || !combo.def || combo.ratio === 0) continue;

      let multiplier = 1.0;
      if (DamageCalculator.ELEMENT_ADVANTAGE[combo.atk] === combo.def) {
        multiplier = 1.3; // 130%
      } else if (DamageCalculator.ELEMENT_DISADVANTAGE[combo.atk] === combo.def) {
        multiplier = 0.7; // 70%
      }

      totalMultiplier += multiplier * combo.ratio;
    }

    return totalMultiplier || 1.0;
  }

  /**
   * Critical roll
   */
  private rollCritical(critChance: number): boolean {
    return Math.random() * 100 < critChance;
  }

  /**
   * Status weakness multiplier
   * Poison+Fire, Petrify+Wind, Paralysis+Earth, Burn+Water = 120%
   */
  private getStatusWeaknessMultiplier(
    statusEffects: StatusEffect[],
    attackElement?: ElementInfo
  ): number {
    if (!attackElement) return 1.0;

    for (const effect of statusEffects) {
      const weakElement = DamageCalculator.STATUS_WEAKNESS[effect.type];
      if (
        weakElement === attackElement.primary ||
        weakElement === attackElement.secondary
      ) {
        return 1.2; // 120%
      }
    }

    return 1.0;
  }

  /**
   * Hit/Evasion check
   */
  calculateHit(
    _attacker: BattleUnit,
    defender: BattleUnit,
    weaponAccuracy: number = 100
  ): { hit: boolean; evaded: boolean } {
    // Step 1: Weapon accuracy
    const hitRoll = Math.random() * 100;
    if (hitRoll > weaponAccuracy) {
      return { hit: false, evaded: false }; // Weapon miss
    }

    // Step 2: Evasion check (AGI × 0.3 = EVA%)
    const evasionRate = defender.stats.eva;
    const evadeRoll = Math.random() * 100;

    if (evadeRoll < evasionRate) {
      return { hit: false, evaded: true }; // Evaded
    }

    return { hit: true, evaded: false };
  }

  /**
   * Calculate heal amount
   */
  calculateHeal(healer: BattleUnit, healRatio: number): number {
    // Heal based on INT stat
    const baseHeal = healer.stats.atk * (healRatio / 100);
    return Math.floor(baseHeal);
  }
}

export const damageCalculator = new DamageCalculator();
