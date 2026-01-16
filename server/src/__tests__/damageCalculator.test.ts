import { DamageCalculator } from '../services/battle/damageCalculator';
import type { BattleUnit, ElementType } from '../types/game';

describe('DamageCalculator', () => {
  let calculator: DamageCalculator;

  // 4스탯 시스템 (HP, ATK, DEF, SPD) + 기력(Energy)
  const createMockUnit = (overrides: Partial<BattleUnit> = {}): BattleUnit => ({
    id: 'unit-1',
    type: 'character',
    name: 'Test Unit',
    level: 10,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    stats: {
      hp: 100,
      atk: 50,
      def: 30,
      spd: 20,
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
      const attacker = createMockUnit({ stats: { hp: 100, atk: 100, def: 10, spd: 20 } });
      const defender = createMockUnit({ stats: { hp: 100, atk: 30, def: 20, spd: 10 } });

      const result = calculator.calculate(attacker, defender);

      expect(result.damage).toBeGreaterThan(0);
    });

    it('should deal minimum 1 damage', () => {
      const attacker = createMockUnit({ stats: { hp: 100, atk: 1, def: 10, spd: 20 } });
      const defender = createMockUnit({ stats: { hp: 100, atk: 30, def: 1000, spd: 10 } });

      const result = calculator.calculate(attacker, defender);

      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    it('should reduce damage when defending', () => {
      const attacker = createMockUnit();
      const defender = createMockUnit({ isDefending: true });

      // critChance를 0으로 설정해서 크리티컬 방지
      const normalResult = calculator.calculate(attacker, createMockUnit(), { critChance: 0 });
      const defendingResult = calculator.calculate(attacker, defender, { critChance: 0 });

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
      const attacker = createMockUnit({ stats: { hp: 100, atk: 100, def: 10, spd: 20 } });
      const defender = createMockUnit({ stats: { hp: 100, atk: 30, def: 100, spd: 10 } });

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
      // SPD가 낮으면 회피율도 낮음 (회피율 = min(30, SPD * 0.15))
      const defender = createMockUnit({ stats: { hp: 100, atk: 10, def: 10, spd: 0 } });

      const result = calculator.calculateHit(attacker, defender, 100);

      expect(result.hit).toBe(true);
    });

    it('should sometimes miss against high SPD (evasion based on SPD)', () => {
      const attacker = createMockUnit();
      // 높은 SPD = 높은 회피율 (SPD 200 → 회피율 30% 최대치)
      const defender = createMockUnit({ stats: { hp: 100, atk: 10, def: 10, spd: 200 } });

      let missCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = calculator.calculateHit(attacker, defender, 70);
        if (!result.hit) missCount++;
      }

      // SPD 200 → 회피율 30%, 명중률 70% → 실제 명중 ~49%
      expect(missCount).toBeGreaterThan(0);
    });
  });

  describe('calculateHeal', () => {
    it('should calculate heal based on healer ATK stat', () => {
      // 4스탯 시스템에서는 INT 없음, ATK 기반 회복
      const healer = createMockUnit({ stats: { hp: 100, atk: 100, def: 10, spd: 10 } });

      // Heal ratio 50% of ATK
      const heal = calculator.calculateHeal(healer, 50);

      // 100 * (50/100) = 50
      expect(heal).toBe(50);
    });

    it('should floor the heal amount', () => {
      const healer = createMockUnit({ stats: { hp: 100, atk: 33, def: 10, spd: 10 } });

      const heal = calculator.calculateHeal(healer, 50);

      // 33 * 0.5 = 16.5 -> 16
      expect(heal).toBe(16);
    });
  });
});
