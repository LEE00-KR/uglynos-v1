import {
  randomInt,
  randomFloat,
  generateBaseStats,
  generateBonusStats,
  determineGrowthGroup,
  calculateGrowthRates,
  calculateLevelUpIncrease,
  processLevelUp,
  calculateAverageGrowthRates,
  getExpectedGrowthRates,
} from '../utils/monster';
import { GROWTH_GROUPS, getRequiredExpForLevel, MAX_LEVEL } from '../config/monster';
import type { MonsterSpecies, MonsterInstance, StatBlock } from '../types/monster';

describe('Monster Growth System', () => {
  // 테스트용 종족 템플릿
  const mockSpecies: MonsterSpecies = {
    id: 1,
    name: '불도마뱀',
    description: '테스트용 몬스터',
    element: 'fire',
    elementRatio: 100,
    rarity: 'common',
    baseStats: {
      hp: { min: 30, max: 50 },
      atk: { min: 5, max: 10 },
      def: { min: 5, max: 10 },
      spd: { min: 5, max: 10 },
    },
    bonusPool: { min: 0, max: 10 },
    growthRates: {
      hp: { min: 5, max: 15 },
      atk: { min: 1, max: 2 },
      def: { min: 1, max: 2 },
      spd: { min: 1, max: 2 },
    },
    maxLevel: 99,
  };

  // 테스트용 몬스터 인스턴스 생성
  const createMockMonster = (overrides: Partial<MonsterInstance> = {}): MonsterInstance => ({
    id: 'test-pet-1',
    speciesId: 1,
    ownerId: 'test-char-1',
    level: 1,
    exp: 0,
    baseInitialStats: { hp: 40, atk: 8, def: 7, spd: 8 },
    bonusStats: { hp: 2, atk: 1, def: 1, spd: 0 },
    initialStats: { hp: 42, atk: 9, def: 8, spd: 8 },
    currentStats: { hp: 42, atk: 9, def: 8, spd: 8 },
    currentHp: 42,
    currentMp: 50,
    maxMp: 50,
    growthGroup: 'B',
    growthRates: {
      hp: { min: 4, max: 12 },
      atk: { min: 0.8, max: 1.6 },
      def: { min: 0.8, max: 1.6 },
      spd: { min: 0.8, max: 1.6 },
    },
    growthHistory: { hp: [], atk: [], def: [], spd: [] },
    isRareColor: false,
    loyalty: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('Random Utilities', () => {
    it('randomInt should return integer within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(5, 10);
        expect(result).toBeGreaterThanOrEqual(5);
        expect(result).toBeLessThanOrEqual(10);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('randomFloat should return float within range', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomFloat(0.5, 1.5);
        expect(result).toBeGreaterThanOrEqual(0.5);
        expect(result).toBeLessThanOrEqual(1.5);
      }
    });
  });

  describe('generateBaseStats', () => {
    it('should generate stats within species range', () => {
      for (let i = 0; i < 50; i++) {
        const stats = generateBaseStats(mockSpecies);

        expect(stats.hp).toBeGreaterThanOrEqual(mockSpecies.baseStats.hp.min);
        expect(stats.hp).toBeLessThanOrEqual(mockSpecies.baseStats.hp.max);

        expect(stats.atk).toBeGreaterThanOrEqual(mockSpecies.baseStats.atk.min);
        expect(stats.atk).toBeLessThanOrEqual(mockSpecies.baseStats.atk.max);

        expect(stats.def).toBeGreaterThanOrEqual(mockSpecies.baseStats.def.min);
        expect(stats.def).toBeLessThanOrEqual(mockSpecies.baseStats.def.max);

        expect(stats.spd).toBeGreaterThanOrEqual(mockSpecies.baseStats.spd.min);
        expect(stats.spd).toBeLessThanOrEqual(mockSpecies.baseStats.spd.max);
      }
    });
  });

  describe('generateBonusStats', () => {
    it('should generate bonus stats within pool range', () => {
      for (let i = 0; i < 50; i++) {
        const bonus = generateBonusStats(mockSpecies);
        const total = bonus.hp + bonus.atk + bonus.def + bonus.spd;

        expect(total).toBeGreaterThanOrEqual(mockSpecies.bonusPool.min);
        expect(total).toBeLessThanOrEqual(mockSpecies.bonusPool.max);
      }
    });

    it('should distribute bonus to all stats', () => {
      // 여러 번 실행해서 모든 스탯에 보너스가 분배되는지 확인
      const totals = { hp: 0, atk: 0, def: 0, spd: 0 };
      for (let i = 0; i < 100; i++) {
        const bonus = generateBonusStats(mockSpecies);
        totals.hp += bonus.hp;
        totals.atk += bonus.atk;
        totals.def += bonus.def;
        totals.spd += bonus.spd;
      }

      // 모든 스탯에 어느 정도 분배되었는지 확인
      expect(totals.hp).toBeGreaterThan(0);
      expect(totals.atk).toBeGreaterThan(0);
      expect(totals.def).toBeGreaterThan(0);
      expect(totals.spd).toBeGreaterThan(0);
    });
  });

  describe('determineGrowthGroup', () => {
    it('should return S for 95%+ base stats', () => {
      // 최대치에 가까운 스탯
      const maxStats: StatBlock = { hp: 50, atk: 10, def: 10, spd: 10 };
      const group = determineGrowthGroup(maxStats, mockSpecies);
      expect(group).toBe('S');
    });

    it('should return C or D for minimum base stats', () => {
      // 최소치 스탯 (50% = C 그룹 경계)
      const minStats: StatBlock = { hp: 30, atk: 5, def: 5, spd: 5 };
      const group = determineGrowthGroup(minStats, mockSpecies);
      // 5+5+5 / 10+10+10 = 15/30 = 50% -> C 그룹
      expect(['C', 'D']).toContain(group);
    });

    it('should return appropriate group for mid-range stats', () => {
      // 중간값 스탯 (약 75%)
      const midStats: StatBlock = { hp: 40, atk: 7, def: 8, spd: 8 };
      const group = determineGrowthGroup(midStats, mockSpecies);
      expect(['B', 'C']).toContain(group);
    });

    it('should only consider combat stats (atk, def, spd), not HP', () => {
      // HP가 다르더라도 combat stats가 같으면 같은 그룹
      const stats1: StatBlock = { hp: 30, atk: 10, def: 10, spd: 10 };
      const stats2: StatBlock = { hp: 50, atk: 10, def: 10, spd: 10 };

      const group1 = determineGrowthGroup(stats1, mockSpecies);
      const group2 = determineGrowthGroup(stats2, mockSpecies);

      expect(group1).toBe(group2);
    });
  });

  describe('calculateGrowthRates', () => {
    it('should apply S group multiplier (1.0)', () => {
      const rates = calculateGrowthRates(mockSpecies, 'S');

      expect(rates.atk.min).toBe(mockSpecies.growthRates.atk.min * 1.0);
      expect(rates.atk.max).toBe(mockSpecies.growthRates.atk.max * 1.0);
    });

    it('should apply C group multiplier (0.7)', () => {
      const rates = calculateGrowthRates(mockSpecies, 'C');

      expect(rates.atk.min).toBe(mockSpecies.growthRates.atk.min * 0.7);
      expect(rates.atk.max).toBe(mockSpecies.growthRates.atk.max * 0.7);
    });

    it('should apply D group multiplier (0.6)', () => {
      const rates = calculateGrowthRates(mockSpecies, 'D');

      expect(rates.atk.min).toBe(mockSpecies.growthRates.atk.min * 0.6);
      expect(rates.atk.max).toBe(mockSpecies.growthRates.atk.max * 0.6);
    });
  });

  describe('calculateLevelUpIncrease', () => {
    it('should return value within range with variance', () => {
      const range = { min: 1, max: 2 };

      for (let i = 0; i < 100; i++) {
        const increase = calculateLevelUpIncrease(range);

        // 범위 * 변동계수 (0.8~1.2)
        // 최소: 1 * 0.8 = 0.8
        // 최대: 2 * 1.2 = 2.4
        expect(increase).toBeGreaterThanOrEqual(0.8);
        expect(increase).toBeLessThanOrEqual(2.4);
      }
    });
  });

  describe('processLevelUp', () => {
    it('should increase level by 1', () => {
      const monster = createMockMonster({ level: 5 });
      const result = processLevelUp(monster);

      expect(result.previousLevel).toBe(5);
      expect(result.newLevel).toBe(6);
      expect(monster.level).toBe(6);
    });

    it('should increase all stats', () => {
      const monster = createMockMonster();
      const prevStats = { ...monster.currentStats };

      processLevelUp(monster);

      expect(monster.currentStats.hp).toBeGreaterThan(prevStats.hp);
      expect(monster.currentStats.atk).toBeGreaterThan(prevStats.atk);
      expect(monster.currentStats.def).toBeGreaterThan(prevStats.def);
      expect(monster.currentStats.spd).toBeGreaterThan(prevStats.spd);
    });

    it('should record growth history', () => {
      const monster = createMockMonster();

      processLevelUp(monster);

      expect(monster.growthHistory.hp.length).toBe(1);
      expect(monster.growthHistory.atk.length).toBe(1);
      expect(monster.growthHistory.def.length).toBe(1);
      expect(monster.growthHistory.spd.length).toBe(1);
    });

    it('should return stat increases', () => {
      const monster = createMockMonster();
      const result = processLevelUp(monster);

      expect(result.statIncreases.hp).toBeGreaterThan(0);
      expect(result.statIncreases.atk).toBeGreaterThan(0);
      expect(result.statIncreases.def).toBeGreaterThan(0);
      expect(result.statIncreases.spd).toBeGreaterThan(0);
    });
  });

  describe('calculateAverageGrowthRates', () => {
    it('should calculate correct averages', () => {
      const history = {
        hp: [10, 12, 8],
        atk: [1.5, 1.8, 1.2],
        def: [1.0, 1.2, 1.1],
        spd: [1.3, 1.4, 1.5],
      };

      const avg = calculateAverageGrowthRates(history);

      expect(avg.hp).toBe(10); // (10+12+8)/3 = 10
      expect(avg.atk).toBe(1.5); // (1.5+1.8+1.2)/3 = 1.5
      expect(avg.def).toBe(1.1); // (1.0+1.2+1.1)/3 = 1.1
      expect(avg.spd).toBe(1.4); // (1.3+1.4+1.5)/3 = 1.4
      expect(avg.total).toBe(4); // 1.5+1.1+1.4 = 4.0
    });

    it('should return 0 for empty history', () => {
      const history = {
        hp: [],
        atk: [],
        def: [],
        spd: [],
      };

      const avg = calculateAverageGrowthRates(history);

      expect(avg.hp).toBe(0);
      expect(avg.atk).toBe(0);
      expect(avg.def).toBe(0);
      expect(avg.spd).toBe(0);
      expect(avg.total).toBe(0);
    });
  });

  describe('getExpectedGrowthRates', () => {
    it('should return average of min and max', () => {
      const rates = {
        hp: { min: 5, max: 15 },
        atk: { min: 1, max: 2 },
        def: { min: 1, max: 2 },
        spd: { min: 1, max: 2 },
      };

      const expected = getExpectedGrowthRates(rates);

      expect(expected.hp).toBe(10); // (5+15)/2
      expect(expected.atk).toBe(1.5); // (1+2)/2
      expect(expected.def).toBe(1.5);
      expect(expected.spd).toBe(1.5);
      expect(expected.total).toBe(4.5); // 1.5*3
    });
  });

  describe('Experience System', () => {
    it('should return fixed exp for early levels', () => {
      expect(getRequiredExpForLevel(1)).toBe(10);
      expect(getRequiredExpForLevel(2)).toBe(25);
      expect(getRequiredExpForLevel(3)).toBe(50);
      expect(getRequiredExpForLevel(4)).toBe(100);
    });

    it('should increase exp requirement with level', () => {
      const exp10 = getRequiredExpForLevel(10);
      const exp20 = getRequiredExpForLevel(20);
      const exp50 = getRequiredExpForLevel(50);

      expect(exp20).toBeGreaterThan(exp10);
      expect(exp50).toBeGreaterThan(exp20);
    });

    it('should return Infinity for max level', () => {
      expect(getRequiredExpForLevel(MAX_LEVEL)).toBe(Infinity);
    });
  });

  describe('Growth Group Distribution', () => {
    it('S group should have correct settings', () => {
      expect(GROWTH_GROUPS.S.ratioMin).toBe(95);
      expect(GROWTH_GROUPS.S.multiplier).toBe(1.0);
      expect(GROWTH_GROUPS.S.stars).toBe(3);
    });

    it('D group should have correct settings', () => {
      expect(GROWTH_GROUPS.D.ratioMax).toBe(49);
      expect(GROWTH_GROUPS.D.multiplier).toBe(0.6);
      expect(GROWTH_GROUPS.D.stars).toBe(0);
    });

    it('groups should have non-overlapping ratio ranges', () => {
      expect(GROWTH_GROUPS.S.ratioMin).toBeGreaterThan(GROWTH_GROUPS.A.ratioMax);
      expect(GROWTH_GROUPS.A.ratioMin).toBeGreaterThan(GROWTH_GROUPS.B.ratioMax);
      expect(GROWTH_GROUPS.B.ratioMin).toBeGreaterThan(GROWTH_GROUPS.C.ratioMax);
      expect(GROWTH_GROUPS.C.ratioMin).toBeGreaterThan(GROWTH_GROUPS.D.ratioMax);
    });
  });

  describe('Same Initial Stats, Different Growth', () => {
    it('should demonstrate S vs D group difference', () => {
      // 같은 최종 초기치지만 다른 기본 초기치
      const sGroupMonster = createMockMonster({
        baseInitialStats: { hp: 40, atk: 10, def: 10, spd: 10 }, // 100% (S)
        bonusStats: { hp: 2, atk: 0, def: 0, spd: 0 },
        initialStats: { hp: 42, atk: 10, def: 10, spd: 10 },
        currentStats: { hp: 42, atk: 10, def: 10, spd: 10 },
        growthGroup: 'S',
        growthRates: {
          hp: { min: 5, max: 15 }, // 1.0x
          atk: { min: 1, max: 2 },
          def: { min: 1, max: 2 },
          spd: { min: 1, max: 2 },
        },
      });

      const dGroupMonster = createMockMonster({
        baseInitialStats: { hp: 40, atk: 5, def: 5, spd: 5 }, // 50% (D)
        bonusStats: { hp: 2, atk: 5, def: 5, spd: 5 },
        initialStats: { hp: 42, atk: 10, def: 10, spd: 10 }, // 같은 최종 초기치!
        currentStats: { hp: 42, atk: 10, def: 10, spd: 10 },
        growthGroup: 'D',
        growthRates: {
          hp: { min: 3, max: 9 }, // 0.6x
          atk: { min: 0.6, max: 1.2 },
          def: { min: 0.6, max: 1.2 },
          spd: { min: 0.6, max: 1.2 },
        },
      });

      // 동일한 초기 공격력
      expect(sGroupMonster.initialStats.atk).toBe(dGroupMonster.initialStats.atk);

      // 98번 레벨업 시뮬레이션
      for (let i = 0; i < 98; i++) {
        processLevelUp(sGroupMonster);
        processLevelUp(dGroupMonster);
      }

      // S 그룹이 더 강해야 함
      expect(sGroupMonster.currentStats.atk).toBeGreaterThan(dGroupMonster.currentStats.atk);
      expect(sGroupMonster.currentStats.def).toBeGreaterThan(dGroupMonster.currentStats.def);
      expect(sGroupMonster.currentStats.spd).toBeGreaterThan(dGroupMonster.currentStats.spd);

      // 차이가 유의미해야 함 (최소 30% 이상)
      const atkDiff = sGroupMonster.currentStats.atk / dGroupMonster.currentStats.atk;
      expect(atkDiff).toBeGreaterThan(1.3);
    });
  });
});
