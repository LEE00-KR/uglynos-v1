import { v4 as uuidv4 } from 'uuid';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { supabase } from '../config/database.js';
import { NotFoundError, BattleError } from '../utils/errors.js';
import { calculateDerivedStats } from '../utils/formulas.js';
import { turnManager } from './battle/turnManager.js';
import { damageCalculator } from './battle/damageCalculator.js';
import { statusEffectManager } from './battle/statusEffectManager.js';
import { captureManager } from './battle/captureManager.js';
import { loyaltyManager } from './battle/loyaltyManager.js';
import { rewardCalculator } from './battle/rewardCalculator.js';
import type {
  BattleState,
  BattleUnit,
  BattleAction,
  ElementType,
  StatusEffect,
  BattleRewards,
} from '../types/game.js';

const TURN_TIMEOUT = 30000;

interface StartBattleInput {
  stageId: number;
  partyPetIds?: string[];
  ridingPetId?: string | null;
}

interface BattleActionInput {
  battleId: string;
  actorId: string;
  type: string;
  targetId?: string;
  spellId?: number;
  itemId?: string;
  skillId?: number;
}

interface ActionResult {
  actorId: string;
  actionType: string;
  targetId?: string;
  damage?: number;
  healing?: number;
  isCritical?: boolean;
  isEvaded?: boolean;
  isMiss?: boolean;
  statusApplied?: string;
  message: string;
}

interface StatusEffectResult {
  unitId: string;
  effectType: string;
  damage?: number;
  applied?: boolean;
  expired?: boolean;
  message: string;
}

interface TurnResult {
  turnNumber: number;
  actions: ActionResult[];
  statusEffects: StatusEffectResult[];
  unitUpdates: Map<string, Partial<BattleUnit>>;
  defeatedUnits: string[];
  capturedPet?: {
    templateId: number;
    name: string;
    isRareColor: boolean;
  };
  battleEnded: boolean;
  result?: 'victory' | 'defeat' | 'fled';
  rewards?: BattleRewards;
}

class BattleService {
  async startBattle(characterId: string, input: StartBattleInput): Promise<BattleState> {
    const battleId = uuidv4();

    // Load character
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (!character) throw new NotFoundError('캐릭터');

    // Load stage
    const { data: stage } = await supabase
      .from('stage_templates')
      .select('*')
      .eq('id', input.stageId)
      .single();

    if (!stage) throw new NotFoundError('스테이지');

    // Load pets (only if provided)
    const petIds = input.partyPetIds && input.partyPetIds.length > 0
      ? input.partyPetIds
      : [];

    let pets: any[] = [];
    if (petIds.length > 0) {
      const { data } = await supabase
        .from('pets')
        .select('*, pet_templates (*)')
        .in('id', petIds);
      pets = data || [];
    }

    // Load monsters
    const { data: stageMonsters } = await supabase
      .from('stage_monsters')
      .select('*, monster_templates (*)')
      .eq('stage_id', input.stageId)
      .eq('wave_number', 1);

    // Create units map
    const units = new Map<string, BattleUnit>();

    // Character unit
    const charStats = calculateDerivedStats(
      {
        str: character.stat_str,
        agi: character.stat_agi,
        vit: character.stat_vit,
        con: character.stat_con,
        int: character.stat_int,
      },
      character.level
    );

    units.set(characterId, {
      id: characterId,
      type: 'character',
      name: character.nickname,
      level: character.level,
      hp: character.current_hp || charStats.maxHp,
      maxHp: charStats.maxHp,
      mp: character.current_mp || charStats.maxMp,
      maxMp: charStats.maxMp,
      stats: {
        atk: charStats.atk,
        def: charStats.def,
        spd: charStats.spd,
        eva: charStats.eva,
      },
      element: {
        primary: character.element_primary as ElementType,
        secondary: character.element_secondary as ElementType | undefined,
        primaryRatio: character.element_primary_ratio,
      },
      statusEffects: [],
      isAlive: true,
      isDefending: false,
    });

    // Pet units
    for (const pet of pets) {
      const petStats = calculateDerivedStats(
        {
          str: pet.stat_str,
          agi: pet.stat_agi,
          vit: pet.stat_vit,
          con: pet.stat_con,
          int: pet.stat_int,
        },
        pet.level
      );

      units.set(pet.id, {
        id: pet.id,
        type: 'pet',
        templateId: pet.template_id,
        ownerId: characterId,
        name: pet.nickname || pet.pet_templates.name,
        level: pet.level,
        hp: pet.current_hp || petStats.maxHp,
        maxHp: petStats.maxHp,
        mp: pet.current_mp || petStats.maxMp,
        maxMp: petStats.maxMp,
        stats: {
          atk: petStats.atk,
          def: petStats.def,
          spd: petStats.spd,
          eva: petStats.eva,
        },
        element: {
          primary: pet.pet_templates.element_primary as ElementType,
          secondary: pet.pet_templates.element_secondary as ElementType | undefined,
          primaryRatio: pet.pet_templates.element_primary_ratio,
        },
        statusEffects: [],
        loyalty: pet.loyalty,
        isAlive: true,
        isDefending: false,
      });
    }

    // Enemy units
    if (stageMonsters) {
      for (const sm of stageMonsters) {
        const m = sm.monster_templates;
        const lvl =
          stage.monster_level_min +
          Math.floor(Math.random() * (stage.monster_level_max - stage.monster_level_min + 1));
        const count =
          sm.spawn_count_min +
          Math.floor(Math.random() * (sm.spawn_count_max - sm.spawn_count_min + 1));

        for (let i = 0; i < count; i++) {
          const eid = uuidv4();
          const hp = m.base_hp + m.growth_hp * (lvl - 1);
          const mp = m.base_mp + m.growth_mp * (lvl - 1);

          units.set(eid, {
            id: eid,
            type: 'enemy',
            templateId: m.id,
            name: m.name,
            level: lvl,
            hp,
            maxHp: hp,
            mp,
            maxMp: mp,
            stats: {
              atk: m.base_str + m.growth_str * (lvl - 1),
              def: m.base_con + m.growth_con * (lvl - 1),
              spd: m.base_agi + m.growth_agi * (lvl - 1),
              eva: m.base_agi * 0.2,
            },
            element: {
              primary: m.element_primary as ElementType,
              secondary: m.element_secondary as ElementType | undefined,
              primaryRatio: m.element_primary_ratio,
            },
            statusEffects: [],
            isCapturable: m.linked_pet_id !== null && lvl === 1,
            isRareColor: Math.random() < 0.03,
            isAlive: true,
            isDefending: false,
          });
        }
      }
    }

    const turnOrder = turnManager.calculateTurnOrder(Array.from(units.values()));

    const battleState: BattleState = {
      id: battleId,
      stageId: input.stageId,
      phase: 'in_progress',
      turnNumber: 1,
      units,
      turnOrder,
      currentTurnIndex: 0,
      pendingActions: new Map(),
      participants: [characterId],
      turnStartedAt: Date.now(),
      turnTimeout: TURN_TIMEOUT,
      potentialDrops: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveBattleState(battleId, battleState);
    return battleState;
  }

  async submitAction(characterId: string, input: BattleActionInput): Promise<void> {
    const battleState = await this.getBattleStateFromRedis(input.battleId);

    if (!battleState.participants.includes(characterId)) {
      throw new BattleError('BATTLE_NOT_PARTICIPANT', '전투 참가자가 아닙니다');
    }
    if (battleState.phase !== 'in_progress') {
      throw new BattleError('BATTLE_ALREADY_ENDED', '이미 종료된 전투입니다');
    }

    // Store action for the actor
    const actorUnit = battleState.units.get(input.actorId);
    if (actorUnit?.isAlive) {
      // Verify ownership for pets
      if (actorUnit.type === 'pet' && actorUnit.ownerId !== characterId) {
        throw new BattleError('BATTLE_NOT_OWNER', '자신의 펫만 조종할 수 있습니다');
      }

      battleState.pendingActions.set(input.actorId, {
        actorId: input.actorId,
        type: input.type as BattleAction['type'],
        targetId: input.targetId,
        spellId: input.spellId,
        itemId: input.itemId,
        skillId: input.skillId,
      });
    }

    await this.saveBattleState(input.battleId, battleState);
  }

  async processTurn(battleId: string): Promise<TurnResult> {
    const battleState = await this.getBattleStateFromRedis(battleId);

    const results: ActionResult[] = [];
    const statusResults: StatusEffectResult[] = [];
    const unitUpdates = new Map<string, Partial<BattleUnit>>();
    const defeatedUnits: string[] = [];
    let capturedPet: TurnResult['capturedPet'] = undefined;

    // Turn start status effects
    for (const unit of battleState.units.values()) {
      if (!unit.isAlive) continue;
      const dmg = statusEffectManager.processTurnStart(unit);
      dmg.forEach((d) =>
        statusResults.push({
          unitId: unit.id,
          effectType: d.type,
          damage: d.damage,
          message: d.message || '',
        })
      );
    }

    // Enemy AI
    this.generateEnemyActions(battleState);

    // Process turn order
    for (const unitId of battleState.turnOrder) {
      const unit = battleState.units.get(unitId);
      if (!unit?.isAlive) continue;

      const canAct = statusEffectManager.canAct(unit);
      if (!canAct.canAct) {
        results.push({
          actorId: unitId,
          actionType: 'skip',
          message: `${unit.name}은(는) ${canAct.reason} 상태로 행동 불가!`,
        });
        continue;
      }

      if (unit.type === 'pet') {
        const disobey = loyaltyManager.checkDisobey(unit);
        if (disobey.disobeyed) {
          results.push({
            actorId: unitId,
            actionType: 'disobey',
            message: disobey.message || '',
          });
          continue;
        }
      }

      const action = battleState.pendingActions.get(unitId);
      if (action) {
        const actionResult = this.processAction(battleState, unit, action);
        results.push(actionResult);

        // Check for capture
        if (action.type === 'capture' && actionResult.message.includes('성공')) {
          const target = battleState.units.get(action.targetId || '');
          if (target) {
            capturedPet = {
              templateId: target.templateId || 0,
              name: target.name,
              isRareColor: target.isRareColor || false,
            };
          }
        }
      }

      const end = turnManager.checkBattleEnd(battleState);
      if (end) {
        battleState.phase = end;
        break;
      }
    }

    // Turn end status
    for (const unit of battleState.units.values()) {
      if (!unit.isAlive) continue;
      statusEffectManager.processTurnEnd(unit).forEach((exp) => {
        statusResults.push({
          unitId: unit.id,
          effectType: exp,
          expired: true,
          message: `${unit.name}의 ${exp} 효과 해제!`,
        });
      });
    }

    // Collect unit updates and defeated units
    for (const unit of battleState.units.values()) {
      unitUpdates.set(unit.id, {
        hp: unit.hp,
        mp: unit.mp,
        isAlive: unit.isAlive,
        statusEffects: unit.statusEffects,
        isDefending: unit.isDefending,
      });

      if (!unit.isAlive) {
        defeatedUnits.push(unit.id);
      }
    }

    // Clear pending actions and advance turn
    battleState.pendingActions.clear();
    if (battleState.phase === 'in_progress') {
      turnManager.advanceTurn(battleState);
    }

    // Calculate rewards on victory
    let rewards: BattleRewards | undefined;
    if (battleState.phase === 'victory') {
      rewards = await this.calculateBattleRewards(battleState);
    }

    await this.saveBattleState(battleId, battleState);

    return {
      turnNumber: battleState.turnNumber,
      actions: results,
      statusEffects: statusResults,
      unitUpdates,
      defeatedUnits,
      capturedPet,
      battleEnded: battleState.phase !== 'in_progress',
      result: battleState.phase !== 'in_progress' ? battleState.phase : undefined,
      rewards,
    };
  }

  private processAction(
    battleState: BattleState,
    actor: BattleUnit,
    action: BattleAction
  ): ActionResult {
    // Reset defending status
    actor.isDefending = false;

    switch (action.type) {
      case 'attack':
        return this.processAttack(battleState, actor, action);
      case 'defend':
        actor.isDefending = true;
        return {
          actorId: actor.id,
          actionType: 'defend',
          message: `${actor.name} 방어 자세!`,
        };
      case 'capture':
        return this.processCapture(battleState, actor, action);
      case 'flee':
        return {
          actorId: actor.id,
          actionType: 'flee',
          message: `${actor.name} 도주 시도!`,
        };
      case 'wait':
      default:
        return {
          actorId: actor.id,
          actionType: action.type,
          message: `${actor.name} 대기.`,
        };
    }
  }

  private processAttack(
    battleState: BattleState,
    attacker: BattleUnit,
    action: BattleAction
  ): ActionResult {
    let target = battleState.units.get(action.targetId || '');
    if (!target?.isAlive) {
      const enemies = Array.from(battleState.units.values()).filter(
        (u) => u.type === 'enemy' && u.isAlive
      );
      if (!enemies.length) {
        return {
          actorId: attacker.id,
          actionType: 'attack',
          message: '대상 없음!',
        };
      }
      target = enemies[Math.floor(Math.random() * enemies.length)];
    }

    const hit = damageCalculator.calculateHit(attacker, target, 90);
    if (!hit.hit) {
      return hit.evaded
        ? {
            actorId: attacker.id,
            actionType: 'attack',
            targetId: target.id,
            isEvaded: true,
            message: `${target.name} 회피!`,
          }
        : {
            actorId: attacker.id,
            actionType: 'attack',
            targetId: target.id,
            isMiss: true,
            message: `${attacker.name} 빗나감!`,
          };
    }

    // Check gang-up
    const gangUpGroup = turnManager.findGangUpGroup(
      attacker.id,
      battleState.turnOrder,
      battleState.units
    );
    const gangUpBonus = turnManager.getGangUpCritBonus(gangUpGroup.length);

    const dmg = damageCalculator.calculate(attacker, target, {
      critChance: 5,
      gangUpBonus,
    });
    target.hp = Math.max(0, target.hp - dmg.damage);
    if (target.hp <= 0) target.isAlive = false;

    let msg = `${attacker.name}→${target.name} ${dmg.damage} 데미지!`;
    if (gangUpGroup.length > 1) msg = `[다굴 ${gangUpGroup.length}명] ` + msg;
    if (dmg.isCritical) msg += ' 크리티컬!';
    if (!target.isAlive) msg += ` ${target.name} 쓰러짐!`;

    return {
      actorId: attacker.id,
      actionType: 'attack',
      targetId: target.id,
      damage: dmg.damage,
      isCritical: dmg.isCritical,
      message: msg,
    };
  }

  private processCapture(
    battleState: BattleState,
    actor: BattleUnit,
    action: BattleAction
  ): ActionResult {
    const target = battleState.units.get(action.targetId || '');
    if (!target?.isAlive) {
      return {
        actorId: actor.id,
        actionType: 'capture',
        message: '포획 대상 없음!',
      };
    }

    const can = captureManager.canCapture(target);
    if (!can.canCapture) {
      return {
        actorId: actor.id,
        actionType: 'capture',
        message: `포획 불가: ${can.reason}`,
      };
    }

    const result = captureManager.tryCatch(target, actor);
    if (result.success) {
      target.isAlive = false;
      return {
        actorId: actor.id,
        actionType: 'capture',
        targetId: target.id,
        message: `포획 성공! ${target.name} 획득!`,
      };
    }
    return {
      actorId: actor.id,
      actionType: 'capture',
      targetId: target.id,
      message: `${target.name} 도망! (${Math.floor(result.catchRate || 0)}%)`,
    };
  }

  private generateEnemyActions(battleState: BattleState): void {
    const allies = Array.from(battleState.units.values()).filter(
      (u) => u.type !== 'enemy' && u.isAlive
    );
    for (const unit of battleState.units.values()) {
      if (
        unit.type !== 'enemy' ||
        !unit.isAlive ||
        battleState.pendingActions.has(unit.id)
      )
        continue;
      const target = allies[Math.floor(Math.random() * allies.length)];
      if (target) {
        battleState.pendingActions.set(unit.id, {
          actorId: unit.id,
          type: 'attack',
          targetId: target.id,
        });
      }
    }
  }

  private async calculateBattleRewards(
    battleState: BattleState
  ): Promise<BattleRewards | undefined> {
    const { data: stage } = await supabase
      .from('stage_templates')
      .select('*')
      .eq('id', battleState.stageId)
      .single();
    if (!stage) return undefined;

    const enemies = Array.from(battleState.units.values())
      .filter((u) => u.type === 'enemy' && !u.isAlive)
      .map((u) => ({
        id: u.id,
        level: u.level,
        isBoss: false,
        isCapturable: u.isCapturable || false,
        baseExp: u.level * (2 + u.level / 20),
      }));

    const participants = battleState.participants.map((id) => ({
      id,
      level: battleState.units.get(id)?.level || 1,
    }));

    return rewardCalculator.calculateRewards(
      battleState,
      {
        expReward: stage.exp_reward,
        goldReward: stage.gold_reward,
        drops: [],
        star_condition_2_turns: stage.star_condition_2_turns,
      },
      participants,
      enemies
    );
  }

  async getBattleState(battleId: string, characterId: string) {
    const state = await this.getBattleStateFromRedis(battleId);
    if (!state.participants.includes(characterId)) {
      throw new BattleError('BATTLE_NOT_PARTICIPANT', '전투 참가자가 아닙니다');
    }
    return this.serializeBattleState(state);
  }

  async attemptFlee(battleId: string, characterId: string) {
    const state = await this.getBattleStateFromRedis(battleId);
    if (!state.participants.includes(characterId)) {
      throw new BattleError('BATTLE_NOT_PARTICIPANT', '전투 참가자가 아닙니다');
    }
    if (state.phase !== 'in_progress') {
      throw new BattleError('BATTLE_ALREADY_ENDED', '이미 종료된 전투입니다');
    }

    const charUnit = state.units.get(characterId);
    const enemies = Array.from(state.units.values()).filter(
      (u) => u.type === 'enemy' && u.isAlive
    );
    const avgEnemySpd = enemies.reduce((s, e) => s + e.stats.spd, 0) / enemies.length;
    const fleeChance = Math.max(
      10,
      Math.min(90, 30 + (charUnit?.stats.spd || 10) - avgEnemySpd)
    );

    const success = Math.random() * 100 < fleeChance;
    if (success) {
      state.phase = 'fled';
      await this.saveBattleState(battleId, state);
    }

    return { success, battleState: this.serializeBattleState(state) };
  }

  private async getBattleStateFromRedis(battleId: string): Promise<BattleState> {
    const data = await redis.get(REDIS_KEYS.BATTLE_STATE(battleId));
    if (!data) throw new NotFoundError('전투');
    const parsed = JSON.parse(data);
    parsed.units = new Map(Object.entries(parsed.units));
    parsed.pendingActions = new Map(Object.entries(parsed.pendingActions || {}));
    return parsed;
  }

  private async saveBattleState(battleId: string, state: BattleState): Promise<void> {
    await redis.setex(
      REDIS_KEYS.BATTLE_STATE(battleId),
      3600,
      JSON.stringify({
        ...state,
        units: Object.fromEntries(state.units),
        pendingActions: Object.fromEntries(state.pendingActions),
      })
    );
  }

  private serializeBattleState(state: BattleState) {
    return {
      ...state,
      units: Object.fromEntries(state.units),
      pendingActions: Object.fromEntries(state.pendingActions),
    };
  }
}

// Export singleton instance
export const battleService = new BattleService();

// Also export individual functions for backward compatibility
export const startBattle = battleService.startBattle.bind(battleService);
export const submitAction = battleService.submitAction.bind(battleService);
export const processTurn = battleService.processTurn.bind(battleService);
export const getBattleState = battleService.getBattleState.bind(battleService);
export const attemptFlee = battleService.attemptFlee.bind(battleService);
