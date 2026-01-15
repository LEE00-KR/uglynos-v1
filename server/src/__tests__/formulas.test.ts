import {
  calculateDerivedStats,
  getRequiredExp,
  calculateMonsterExp,
  getWeaponAccuracy,
  getWeaponMultiplier,
  getWeaponHitCount,
  getWeaponPenalty,
  getElementMultiplier,
} from '../utils/formulas';
import type { BaseStats } from '../types/game';

describe('formulas', () => {
  describe('calculateDerivedStats', () => {
    it('should calculate correct HP based on VIT', () => {
      const baseStats: BaseStats = { str: 10, agi: 10, vit: 20, con: 10, int: 10 };
      const result = calculateDerivedStats(baseStats, 1);

      // HP = 100 + vit * 10 + level * 5
      // HP = 100 + 20 * 10 + 1 * 5 = 305
      expect(result.maxHp).toBe(305);
    });

    it('should calculate correct MP based on INT', () => {
      const baseStats: BaseStats = { str: 10, agi: 10, vit: 10, con: 10, int: 20 };
      const result = calculateDerivedStats(baseStats, 1);

      // MP = 50 + int * 5 + level * 2
      // MP = 50 + 20 * 5 + 1 * 2 = 152
      expect(result.maxMp).toBe(152);
    });

    it('should calculate correct ATK based on STR', () => {
      const baseStats: BaseStats = { str: 20, agi: 10, vit: 10, con: 10, int: 10 };
      const result = calculateDerivedStats(baseStats, 1);

      // ATK = 10 + str * 2 + floor(level * 1.5)
      // ATK = 10 + 20 * 2 + 1 = 51
      expect(result.atk).toBe(51);
    });

    it('should calculate correct DEF based on CON', () => {
      const baseStats: BaseStats = { str: 10, agi: 10, vit: 10, con: 20, int: 10 };
      const result = calculateDerivedStats(baseStats, 1);

      // DEF = 5 + con * 2 + floor(level * 0.8)
      // DEF = 5 + 20 * 2 + 0 = 45
      expect(result.def).toBe(45);
    });

    it('should calculate correct SPD based on AGI', () => {
      const baseStats: BaseStats = { str: 10, agi: 20, vit: 10, con: 10, int: 10 };
      const result = calculateDerivedStats(baseStats, 1);

      // SPD = 10 + agi * 2
      // SPD = 10 + 20 * 2 = 50
      expect(result.spd).toBe(50);
    });

    it('should scale stats correctly with level', () => {
      const baseStats: BaseStats = { str: 10, agi: 10, vit: 10, con: 10, int: 10 };
      const level1 = calculateDerivedStats(baseStats, 1);
      const level10 = calculateDerivedStats(baseStats, 10);

      expect(level10.maxHp).toBeGreaterThan(level1.maxHp);
      expect(level10.maxMp).toBeGreaterThan(level1.maxMp);
      expect(level10.atk).toBeGreaterThan(level1.atk);
      expect(level10.def).toBeGreaterThan(level1.def);
    });
  });

  describe('getRequiredExp', () => {
    it('should return fixed values for early levels', () => {
      expect(getRequiredExp(1)).toBe(8);
      expect(getRequiredExp(2)).toBe(20);
      expect(getRequiredExp(3)).toBe(40);
      expect(getRequiredExp(4)).toBe(100);
    });

    it('should return progressively higher exp for higher levels', () => {
      const exp5 = getRequiredExp(5);
      const exp10 = getRequiredExp(10);
      const exp20 = getRequiredExp(20);

      expect(exp10).toBeGreaterThan(exp5);
      expect(exp20).toBeGreaterThan(exp10);
    });

    it('should handle high level scaling', () => {
      const exp50 = getRequiredExp(50);
      const exp80 = getRequiredExp(80);

      expect(exp50).toBeGreaterThan(0);
      expect(exp80).toBeGreaterThan(exp50);
    });
  });

  describe('calculateMonsterExp', () => {
    it('should calculate base exp correctly', () => {
      // Formula: level * (2 + level/20)
      const exp = calculateMonsterExp(10, false);
      // 10 * (2 + 10/20) = 10 * 2.5 = 25
      expect(exp).toBe(25);
    });

    it('should give 10% bonus for boss monsters', () => {
      const normalExp = calculateMonsterExp(10, false);
      const bossExp = calculateMonsterExp(10, true);

      expect(bossExp).toBe(Math.floor(normalExp * 1.1));
    });
  });

  describe('getWeaponAccuracy', () => {
    it('should return correct accuracy for each weapon type', () => {
      expect(getWeaponAccuracy('sword')).toBe(90);
      expect(getWeaponAccuracy('club')).toBe(100);
      expect(getWeaponAccuracy('axe')).toBe(90);
      expect(getWeaponAccuracy('spear')).toBe(80);
      expect(getWeaponAccuracy('claw')).toBe(90);
      expect(getWeaponAccuracy('bow')).toBe(80);
    });
  });

  describe('getWeaponMultiplier', () => {
    it('should return correct multiplier for each weapon type', () => {
      expect(getWeaponMultiplier('sword')).toBe(1.5);
      expect(getWeaponMultiplier('club')).toBe(1.0);
      expect(getWeaponMultiplier('axe')).toBe(2.0);
      expect(getWeaponMultiplier('spear')).toBe(0.9);
      expect(getWeaponMultiplier('claw')).toBe(0.4);
      expect(getWeaponMultiplier('bow')).toBe(0.8);
    });
  });

  describe('getWeaponHitCount', () => {
    it('should return 1 hit for sword', () => {
      expect(getWeaponHitCount('sword')).toBe(1);
    });

    it('should return 2 hits for spear', () => {
      expect(getWeaponHitCount('spear')).toBe(2);
    });

    it('should return 3 hits for claw', () => {
      expect(getWeaponHitCount('claw')).toBe(3);
    });

    it('should return random hits for bow based on enemy count', () => {
      const hitCount = getWeaponHitCount('bow', 5);
      expect(hitCount).toBeGreaterThanOrEqual(1);
      expect(hitCount).toBeLessThanOrEqual(5);
    });
  });

  describe('getWeaponPenalty', () => {
    it('should return correct penalties for sword', () => {
      const penalty = getWeaponPenalty('sword');
      expect(penalty.agi).toBe(-10);
      expect(penalty.con).toBe(0);
    });

    it('should return correct penalties for axe', () => {
      const penalty = getWeaponPenalty('axe');
      expect(penalty.agi).toBe(-20);
      expect(penalty.con).toBe(-20);
    });

    it('should return no penalties for club', () => {
      const penalty = getWeaponPenalty('club');
      expect(penalty.agi).toBe(0);
      expect(penalty.con).toBe(0);
    });
  });

  describe('getElementMultiplier', () => {
    it('should return 1.3x for advantaged element', () => {
      // Earth > Wind (based on actual cycle)
      const multiplier = getElementMultiplier('earth', 'wind');
      expect(multiplier).toBe(1.3);
    });

    it('should return 0.7x for disadvantaged element', () => {
      // Earth < Water
      const multiplier = getElementMultiplier('earth', 'water');
      expect(multiplier).toBe(0.7);
    });

    it('should return 1.0x for neutral matchup', () => {
      const multiplier = getElementMultiplier('earth', 'earth');
      expect(multiplier).toBe(1.0);
    });

    it('should handle full element advantage cycle', () => {
      // Cycle: Earth → Wind → Fire → Water → Earth (advantage)
      expect(getElementMultiplier('earth', 'wind')).toBe(1.3);
      expect(getElementMultiplier('wind', 'fire')).toBe(1.3);
      expect(getElementMultiplier('fire', 'water')).toBe(1.3);
      expect(getElementMultiplier('water', 'earth')).toBe(1.3);
    });
  });
});
