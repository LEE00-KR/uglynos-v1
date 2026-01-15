import type { BattleUnit, BattleAction, BattleState } from '../../types/game.js';

export class TurnManager {
  /**
   * Calculate turn order based on speed (SPD)
   */
  calculateTurnOrder(units: BattleUnit[]): string[] {
    const aliveUnits = units.filter((u) => u.isAlive);

    const sorted = aliveUnits.sort((a, b) => {
      if (a.stats.spd !== b.stats.spd) {
        return b.stats.spd - a.stats.spd;
      }
      // Deterministic tie-breaker using unit ID
      return a.id.localeCompare(b.id);
    });

    return sorted.map((u) => u.id);
  }

  /**
   * Find gang-up group (allies within ±10% speed)
   */
  findGangUpGroup(
    actorId: string,
    turnOrder: string[],
    units: Map<string, BattleUnit>
  ): string[] {
    const actor = units.get(actorId);
    if (!actor || actor.type === 'enemy') return [actorId];

    const actorSpd = actor.stats.spd;
    const spdMin = actorSpd * 0.9;
    const spdMax = actorSpd * 1.1;

    const group: string[] = [];
    const actorIndex = turnOrder.indexOf(actorId);

    for (let i = actorIndex; i < turnOrder.length; i++) {
      const unit = units.get(turnOrder[i]);
      if (!unit || !unit.isAlive) continue;

      // Enemy breaks gang-up chain
      if (unit.type === 'enemy') break;

      // Check speed range
      if (unit.stats.spd >= spdMin && unit.stats.spd <= spdMax) {
        group.push(unit.id);
      } else {
        break;
      }
    }

    return group;
  }

  /**
   * Gang-up critical bonus
   * 2 units: +10%, 3: +20%, max +50%
   */
  getGangUpCritBonus(participantCount: number): number {
    return Math.min((participantCount - 1) * 10, 50);
  }

  /**
   * Handle turn timeout - units that didn't submit action
   */
  handleTurnTimeout(battleState: BattleState): BattleAction[] {
    const waitingUnits = this.getWaitingUnits(battleState);

    return waitingUnits.map((unitId) => ({
      actorId: unitId,
      type: 'wait' as const,
      reason: 'timeout',
    }));
  }

  /**
   * Get units that haven't submitted actions
   */
  private getWaitingUnits(battleState: BattleState): string[] {
    const submitted = new Set(battleState.pendingActions.keys());
    return Array.from(battleState.units.values())
      .filter((u) => u.isAlive && u.type !== 'enemy' && !submitted.has(u.id))
      .map((u) => u.id);
  }

  /**
   * Get current turn unit
   */
  getCurrentTurnUnit(battleState: BattleState): BattleUnit | null {
    const unitId = battleState.turnOrder[battleState.currentTurnIndex];
    return battleState.units.get(unitId) || null;
  }

  /**
   * Advance to next turn
   */
  advanceTurn(battleState: BattleState): void {
    battleState.currentTurnIndex++;

    // If all units have acted, start new turn
    if (battleState.currentTurnIndex >= battleState.turnOrder.length) {
      battleState.turnNumber++;
      battleState.currentTurnIndex = 0;

      // Recalculate turn order (speed may have changed)
      const aliveUnits = Array.from(battleState.units.values()).filter(
        (u) => u.isAlive
      );
      battleState.turnOrder = this.calculateTurnOrder(aliveUnits);
    }

    battleState.turnStartedAt = Date.now();
    battleState.pendingActions.clear();
  }

  /**
   * Check if battle is over
   */
  checkBattleEnd(battleState: BattleState): 'victory' | 'defeat' | null {
    const allies = Array.from(battleState.units.values()).filter(
      (u) => u.type !== 'enemy'
    );
    const enemies = Array.from(battleState.units.values()).filter(
      (u) => u.type === 'enemy'
    );

    const allAlliesDead = allies.every((u) => !u.isAlive);
    const allEnemiesDead = enemies.every((u) => !u.isAlive);

    if (allEnemiesDead) return 'victory';
    if (allAlliesDead) return 'defeat';
    return null;
  }
}

export const turnManager = new TurnManager();
