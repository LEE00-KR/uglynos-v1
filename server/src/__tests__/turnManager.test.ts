import { TurnManager } from '../services/battle/turnManager';
import type { BattleUnit, ElementType } from '../types/game';

describe('TurnManager', () => {
  let turnManager: TurnManager;

  const createMockUnit = (
    id: string,
    spd: number,
    type: 'character' | 'pet' | 'enemy' = 'character'
  ): BattleUnit => ({
    id,
    type,
    name: `Unit ${id}`,
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    stats: {
      atk: 10,
      def: 10,
      spd,
      eva: 5,
      int: 10,
    },
    element: {
      primary: 'earth' as ElementType,
      primaryRatio: 100,
    },
    statusEffects: [],
    isAlive: true,
    isDefending: false,
  });

  beforeEach(() => {
    turnManager = new TurnManager();
  });

  describe('calculateTurnOrder', () => {
    it('should order units by speed (highest first)', () => {
      const units = [
        createMockUnit('slow', 10),
        createMockUnit('fast', 50),
        createMockUnit('medium', 30),
      ];

      const order = turnManager.calculateTurnOrder(units);

      expect(order[0]).toBe('fast');
      expect(order[1]).toBe('medium');
      expect(order[2]).toBe('slow');
    });

    it('should exclude dead units', () => {
      const deadUnit = createMockUnit('dead', 100);
      deadUnit.isAlive = false;

      const units = [
        createMockUnit('alive1', 50),
        deadUnit,
        createMockUnit('alive2', 30),
      ];

      const order = turnManager.calculateTurnOrder(units);

      expect(order).not.toContain('dead');
      expect(order).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const order = turnManager.calculateTurnOrder([]);
      expect(order).toHaveLength(0);
    });

    it('should deterministically order units with same speed by ID', () => {
      const units = [
        createMockUnit('charlie', 30),
        createMockUnit('alice', 30),
        createMockUnit('bob', 30),
      ];

      const order1 = turnManager.calculateTurnOrder([...units]);
      const order2 = turnManager.calculateTurnOrder([...units]);

      // Should be consistent due to ID comparison
      expect(order1).toEqual(order2);
    });
  });

  describe('findGangUpGroup', () => {
    it('should find allies within 10% speed range', () => {
      const units = new Map<string, BattleUnit>();
      units.set('char1', createMockUnit('char1', 100));
      units.set('char2', createMockUnit('char2', 95)); // Within 10%
      units.set('char3', createMockUnit('char3', 105)); // Within 10%
      units.set('char4', createMockUnit('char4', 80)); // Outside 10%

      const turnOrder = ['char1', 'char2', 'char3', 'char4'];
      const group = turnManager.findGangUpGroup('char1', turnOrder, units);

      expect(group).toContain('char1');
      expect(group).toContain('char2');
      expect(group).toContain('char3');
      expect(group).not.toContain('char4');
    });

    it('should not include enemies in gang-up group', () => {
      const units = new Map<string, BattleUnit>();
      units.set('char1', createMockUnit('char1', 100, 'character'));
      units.set('enemy1', createMockUnit('enemy1', 100, 'enemy'));

      const turnOrder = ['char1', 'enemy1'];
      const group = turnManager.findGangUpGroup('char1', turnOrder, units);

      expect(group).toContain('char1');
      expect(group).not.toContain('enemy1');
    });

    it('should return only actor if no gang-up available', () => {
      const units = new Map<string, BattleUnit>();
      units.set('char1', createMockUnit('char1', 100));

      const group = turnManager.findGangUpGroup('char1', ['char1'], units);

      expect(group).toEqual(['char1']);
    });

    it('should return only actor ID for enemies', () => {
      const units = new Map<string, BattleUnit>();
      units.set('enemy1', createMockUnit('enemy1', 100, 'enemy'));

      const group = turnManager.findGangUpGroup('enemy1', ['enemy1'], units);

      expect(group).toEqual(['enemy1']);
    });
  });

});
