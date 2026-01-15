import { DamageCalculator } from '../services/battle/damageCalculator';
import type { BattleUnit, ElementType } from '../types/game';

describe('DamageCalculator', () => {
  let calculator: DamageCalculator;

  const createMockUnit = (overrides: Partial<BattleUnit> = {}): BattleUnit => ({
    id: 'unit-1',
    type: 'character',
    name: 'Test Unit',
    level: 10,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    stats: {
      atk: 50,
      def: 30,
      spd: 20,
      eva: 10,
      int: 15,
    },
    element: {
      primary: 'earth' as ElementType,
      primaryRatio: 100,
    },
    statusEffects: [],
    isAlive: true,
    isDefending: false,
    ...overrides,
  });

  beforeEach(() => {
    calculator = new DamageCalculator();
  });

  describe('calculate', () => {
    it('should calculate positive damage', () => {
      const attacker = createMockUnit({ stats: { atk: 100, def: 10, spd: 20, eva: 5, int: 10 } });
      const defender = createMockUnit({ stats: { atk: 30, def: 20, spd: 10, eva: 5, int: 10 } });

      const result = calculator.calculate(attacker, defender);

      expect(result.damage).toBeGreaterThan(0);
    });

    it('should deal minimum 1 damage', () => {
      const attacker = createMockUnit({ stats: { atk: 1, def: 10, spd: 20, eva: 5, int: 10 } });
      const defender = createMockUnit({ stats: { atk: 30, def: 1000, spd: 10, eva: 5, int: 10 } });

      const result = calculator.calculate(attacker, defender);

      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should reduce damage when defending', () => {
      const attacker = createMockUnit();
      const defender = createMockUnit({ isDefending: true });

      const normalResult = calculator.calculate(attacker, createMockUnit());
      const defendingResult = calculator.calculate(attacker, defender);

      expect(defendingResult.damage).toBeLessThan(normalResult.damage);
      expect(defendingResult.wasDefending).toBe(true);
    });

    it('should track critical hits', () => {
      const attacker = createMockUnit();
      const defender = createMockUnit();

      // Run multiple times to get at least one crit
      let hasCrit = false;
      for (let i = 0; i < 100; i++) {
        const result = calculator.calculate(attacker, defender, { critChance: 100 });
        if (result.isCritical) {
          hasCrit = true;
          break;
        }
      }

      expect(hasCrit).toBe(true);
    });

    it('should apply element multiplier (advantage 1.3x)', () => {
      // Fire is advantaged against Water (fire > water = 1.3x)
      const attacker = createMockUnit({
        element: { primary: 'fire' as ElementType, primaryRatio: 100 },
      });
      const defender = createMockUnit({
        element: { primary: 'water' as ElementType, primaryRatio: 100 },
      });

      const result = calculator.calculate(attacker, defender);

      expect(result.elementMultiplier).toBe(1.3);
    });

    it('should apply element multiplier (disadvantage 0.7x)', () => {
      // Fire is disadvantaged against Wind (fire < wind = 0.7x)
      const attacker = createMockUnit({
        element: { primary: 'fire' as ElementType, primaryRatio: 100 },
      });
      const defender = createMockUnit({
        element: { primary: 'wind' as ElementType, primaryRatio: 100 },
      });

      const result = calculator.calculate(attacker, defender);

      expect(result.elementMultiplier).toBe(0.7);
    });

    it('should increase crit chance with gang-up bonus', () => {
      const attacker = createMockUnit({ stats: { atk: 100, def: 10, spd: 20, eva: 5, int: 10 } });
      const defender = createMockUnit({ stats: { atk: 30, def: 100, spd: 10, eva: 5, int: 10 } });

      // With high gang-up bonus, crit chance increases
      let critCountWithBonus = 0;
      for (let i = 0; i < 100; i++) {
        const result = calculator.calculate(attacker, defender, { gangUpBonus: 50, critChance: 50 });
        if (result.isCritical) critCountWithBonus++;
      }

      // With 100% crit chance (50 base + 50 bonus), should have high crit rate
      expect(critCountWithBonus).toBeGreaterThan(80);
    });
  });

  describe('calculateHit', () => {
    it('should hit with 100% accuracy', () => {
      const attacker = createMockUnit();
      const defender = createMockUnit({ stats: { atk: 10, def: 10, spd: 10, eva: 0, int: 10 } });

      const result = calculator.calculateHit(attacker, defender, 100);

      expect(result.hit).toBe(true);
    });

    it('should sometimes miss against high evasion', () => {
      const attacker = createMockUnit();
      const defender = createMockUnit({ stats: { atk: 10, def: 10, spd: 100, eva: 50, int: 10 } });

      let missCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = calculator.calculateHit(attacker, defender, 50);
        if (!result.hit) missCount++;
      }

      expect(missCount).toBeGreaterThan(0);
    });
  });

  describe('calculateHeal', () => {
    it('should calculate heal based on INT stat', () => {
      const healer = createMockUnit({ stats: { atk: 10, def: 10, spd: 10, eva: 5, int: 100 } });

      // Heal ratio 50% of INT
      const heal = calculator.calculateHeal(healer, 50);

      // 100 * (50/100) = 50
      expect(heal).toBe(50);
    });

    it('should floor the heal amount', () => {
      const healer = createMockUnit({ stats: { atk: 10, def: 10, spd: 10, eva: 5, int: 33 } });

      const heal = calculator.calculateHeal(healer, 50);

      // 33 * 0.5 = 16.5 -> 16
      expect(heal).toBe(16);
    });
  });
});
