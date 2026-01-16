import {
  calculateEvasionRate,
  getRequiredExp,
  calculateMonsterExp,
  getWeaponAccuracy,
  getWeaponMultiplier,
  getWeaponHitCount,
  getWeaponPenalty,
  getElementMultiplier,
  generateRandomPetStats,
  generateRandomGrowthRates,
  calculateGrowthGroup,
  calculateLevelUpStatIncrease,
  calculateCatchRate,
} from '../utils/formulas';
import type { BaseStats } from '../types/game';

describe('formulas', () => {
  // =====================================================
  // 회피율 테스트 (SPD 기반, 최대 30%)
  // =====================================================
  describe('calculateEvasionRate', () => {
    it('should return 0 for SPD 0', () => {
      expect(calculateEvasionRate(0)).toBe(0);
    });

    it('should calculate evasion as SPD * 0.15', () => {
      // SPD 100 → 100 * 0.15 = 15%
      expect(calculateEvasionRate(100)).toBe(15);
    });

    it('should cap evasion at 30%', () => {
      // SPD 300 → 300 * 0.15 = 45% → capped at 30%
      expect(calculateEvasionRate(300)).toBe(30);
    });

    it('should return exactly 30% at SPD 200', () => {
      // SPD 200 → 200 * 0.15 = 30%
      expect(calculateEvasionRate(200)).toBe(30);
    });
  });

  // =====================================================
  // 경험치 테스트
  // =====================================================
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

  // =====================================================
  // 무기 테스트
  // =====================================================
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
    it('should return correct penalties for sword (4스탯: spd, def)', () => {
      const penalty = getWeaponPenalty('sword');
      expect(penalty.spd).toBe(-10);
      expect(penalty.def).toBe(0);
    });

    it('should return correct penalties for axe', () => {
      const penalty = getWeaponPenalty('axe');
      expect(penalty.spd).toBe(-20);
      expect(penalty.def).toBe(-20);
    });

    it('should return no penalties for club', () => {
      const penalty = getWeaponPenalty('club');
      expect(penalty.spd).toBe(0);
      expect(penalty.def).toBe(0);
    });
  });

  // =====================================================
  // 속성 상성 테스트
  // =====================================================
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

  // =====================================================
  // 4스탯 펫 생성 테스트
  // =====================================================
  describe('generateRandomPetStats', () => {
    it('should generate stats within range', () => {
      const range = {
        hp: { min: 80, max: 120 },
        atk: { min: 8, max: 12 },
        def: { min: 8, max: 12 },
        spd: { min: 8, max: 12 },
      };
      const bonus = { hp: 10, atk: 2, def: 2, spd: 2 };

      for (let i = 0; i < 10; i++) {
        const stats = generateRandomPetStats(range, bonus);

        expect(stats.hp).toBeGreaterThanOrEqual(range.hp.min);
        expect(stats.hp).toBeLessThanOrEqual(range.hp.max + bonus.hp);
        expect(stats.atk).toBeGreaterThanOrEqual(range.atk.min);
        expect(stats.atk).toBeLessThanOrEqual(range.atk.max + bonus.atk);
        expect(stats.def).toBeGreaterThanOrEqual(range.def.min);
        expect(stats.def).toBeLessThanOrEqual(range.def.max + bonus.def);
        expect(stats.spd).toBeGreaterThanOrEqual(range.spd.min);
        expect(stats.spd).toBeLessThanOrEqual(range.spd.max + bonus.spd);
      }
    });
  });

  describe('generateRandomGrowthRates', () => {
    it('should generate growth rates within range', () => {
      const range = {
        hp: { min: 5.0, max: 10.0 },
        atk: { min: 1.0, max: 2.0 },
        def: { min: 1.0, max: 2.0 },
        spd: { min: 1.0, max: 2.0 },
      };

      for (let i = 0; i < 10; i++) {
        const rates = generateRandomGrowthRates(range);

        expect(rates.hp).toBeGreaterThanOrEqual(range.hp.min);
        expect(rates.hp).toBeLessThanOrEqual(range.hp.max);
        expect(rates.atk).toBeGreaterThanOrEqual(range.atk.min);
        expect(rates.atk).toBeLessThanOrEqual(range.atk.max);
        expect(rates.def).toBeGreaterThanOrEqual(range.def.min);
        expect(rates.def).toBeLessThanOrEqual(range.def.max);
        expect(rates.spd).toBeGreaterThanOrEqual(range.spd.min);
        expect(rates.spd).toBeLessThanOrEqual(range.spd.max);
      }
    });
  });

  // =====================================================
  // 성장 그룹 테스트
  // =====================================================
  describe('calculateGrowthGroup', () => {
    it('should return S for 95%+ stats', () => {
      // 기준 MAX_TOTAL_STATS = 1299
      const stats: BaseStats = { hp: 950, atk: 95, def: 95, spd: 95 }; // 1235 = ~95%
      expect(calculateGrowthGroup(stats)).toBe('S');
    });

    it('should return D for low stats', () => {
      const stats: BaseStats = { hp: 100, atk: 10, def: 10, spd: 10 }; // 130 = ~10%
      expect(calculateGrowthGroup(stats)).toBe('D');
    });

    it('should use custom max stats when provided', () => {
      const stats: BaseStats = { hp: 100, atk: 10, def: 10, spd: 10 }; // 130
      // 130 / 130 = 100% → S
      expect(calculateGrowthGroup(stats, 130)).toBe('S');
    });
  });

  // =====================================================
  // 포획률 테스트
  // 기본 5%, HP/레벨에 따라 증가
  // =====================================================
  describe('calculateCatchRate', () => {
    it('should return base 5% for high HP', () => {
      // HP > 80% → 5%
      expect(calculateCatchRate(0.9, 1)).toBe(5);
      expect(calculateCatchRate(1.0, 1)).toBe(5);
    });

    it('should increase rate as HP decreases', () => {
      // HP ≤ 80% → 10%
      expect(calculateCatchRate(0.8, 1)).toBe(10);
      expect(calculateCatchRate(0.6, 1)).toBe(10);

      // HP ≤ 50% → 20%
      expect(calculateCatchRate(0.5, 1)).toBe(20);
      expect(calculateCatchRate(0.3, 1)).toBe(20);

      // HP ≤ 10% → 30%
      expect(calculateCatchRate(0.1, 1)).toBe(30);
      expect(calculateCatchRate(0.05, 1)).toBe(30);
    });

    it('should add level bonus for catcher', () => {
      // Level 30+ → +10%
      expect(calculateCatchRate(0.9, 30)).toBe(5 + 10);

      // Level 50+ → +20%
      expect(calculateCatchRate(0.9, 50)).toBe(5 + 20);

      // Level 80+ → +30%
      expect(calculateCatchRate(0.9, 80)).toBe(5 + 30);
    });

    it('should combine HP and level bonuses', () => {
      // HP ≤ 10% (30%) + Level 80 (+30%) = 60%
      expect(calculateCatchRate(0.1, 80)).toBe(60);

      // HP ≤ 50% (20%) + Level 50 (+20%) = 40%
      expect(calculateCatchRate(0.5, 50)).toBe(40);
    });

    it('should add item bonus', () => {
      const baseRate = calculateCatchRate(0.5, 1, 0);  // 20%
      const withBonus = calculateCatchRate(0.5, 1, 15);  // 20% + 15%

      expect(withBonus).toBe(baseRate + 15);
    });

    it('should cap at 95%', () => {
      // HP ≤ 10% (30%) + Level 80 (+30%) + item 50% = 110% → capped at 95%
      const rate = calculateCatchRate(0.1, 80, 50);
      expect(rate).toBe(95);
    });
  });

  // =====================================================
  // 레벨업 스탯 증가 테스트
  // =====================================================
  describe('calculateLevelUpStatIncrease', () => {
    it('should return at least 1', () => {
      for (let i = 0; i < 10; i++) {
        const increase = calculateLevelUpStatIncrease(1.0, 'D');
        expect(increase).toBeGreaterThanOrEqual(1);
      }
    });

    it('should scale with growth rate', () => {
      // S그룹에서 성장률 10 vs 5 비교
      let high = 0, low = 0;
      for (let i = 0; i < 100; i++) {
        high += calculateLevelUpStatIncrease(10, 'S');
        low += calculateLevelUpStatIncrease(5, 'S');
      }
      expect(high).toBeGreaterThan(low);
    });
  });
});
