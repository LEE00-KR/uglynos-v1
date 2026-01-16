import { v4 as uuidv4 } from 'uuid';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { supabase } from '../config/database.js';
import { NotFoundError, BattleError } from '../utils/errors.js';
import { DEFAULT_ENERGY, MAX_ENERGY } from '../utils/formulas.js';
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
  BattleRewards,
} from '../types/game.js';

const TURN_TIMEOUT = 30000;

interface StartBattleInput {
  stageId: string;  // string으로 변경 (admin_stages.id)
  partyPetIds?: string[];
  ridingPetId?: string | null;
}

interface BattleActionInput {
  battleId: string;
  actorId: string;
  type: string;
  targetId?: string;
  skillId?: string;
  itemId?: string;
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
    templateId: string;  // string으로 변경
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

    // Load character (4스탯 시스템)
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (!character) throw new NotFoundError('캐릭터');

    // Load stage from admin_stages
    const { data: stage } = await supabase
      .from('admin_stages')
      .select('*')
      .eq('id', input.stageId)
      .single();

    if (!stage) throw new NotFoundError('스테이지');

    // Load pets with admin_pets template
    const petIds = input.partyPetIds && input.partyPetIds.length > 0
      ? input.partyPetIds
      : [];

    let pets: any[] = [];
    if (petIds.length > 0) {
      const { data } = await supabase
        .from('pets')
        .select(`
          *,
          admin_pets (
            id,
            name,
            element_primary,
            element_secondary,
            element_primary_ratio,
            capture_rate
          )
        `)
        .in('id', petIds);
      pets = data || [];
    }

    // Create units map
    const units = new Map<string, BattleUnit>();

    // Character unit (4스탯 직접 사용)
    const charMaxHp = character.stat_hp;
    const charHp = character.current_hp ?? charMaxHp;
    const charEnergy = character.current_energy ?? DEFAULT_ENERGY;

    units.set(characterId, {
      id: characterId,
      type: 'character',
      name: character.nickname,
      level: character.level,
      hp: charHp,
      maxHp: charMaxHp,
      energy: charEnergy,
      maxEnergy: MAX_ENERGY,  // 항상 100 고정
      stats: {
        hp: character.stat_hp,
        atk: character.stat_atk,
        def: character.stat_def,
        spd: character.stat_spd,
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

    // Pet units (4스탯)
    for (const pet of pets) {
      const template = pet.admin_pets;
      const petMaxHp = pet.stat_hp;
      const petHp = pet.current_hp ?? petMaxHp;

      units.set(pet.id, {
        id: pet.id,
        type: 'pet',
        templateId: pet.template_id,
        ownerId: characterId,
        name: pet.nickname || template?.name || 'Unknown',
        level: pet.level,
        hp: petHp,
        maxHp: petMaxHp,
        energy: 0,  // 펫은 기력 사용 안함
        maxEnergy: 0,
        stats: {
          hp: pet.stat_hp,
          atk: pet.stat_atk,
          def: pet.stat_def,
          spd: pet.stat_spd,
        },
        element: {
          primary: (template?.element_primary || 'earth') as ElementType,
          secondary: template?.element_secondary as ElementType | undefined,
          primaryRatio: template?.element_primary_ratio || 100,
        },
        statusEffects: [],
        loyalty: pet.loyalty,
        growthGroup: pet.growth_group,
        growthRates: {
          hp: pet.growth_hp,
          atk: pet.growth_atk,
          def: pet.growth_def,
          spd: pet.growth_spd,
        },
        isAlive: true,
        isDefending: false,
        isRepresentative: pet.is_representative || false,
        isRiding: pet.is_riding || false,
      });
    }

    // Enemy units from stage.monsters (JSONB)
    const monsters = stage.monsters || [];
    for (const monster of monsters) {
      // monster: { petId, slot, level, stats, skills }
      const { data: petTemplate } = await supabase
        .from('admin_pets')
        .select('*')
        .eq('id', monster.petId)
        .single();

      if (!petTemplate) continue;

      const eid = uuidv4();
      const monsterHp = monster.stats?.hp || petTemplate.base_hp_min;

      units.set(eid, {
        id: eid,
        type: 'enemy',
        templateId: petTemplate.id,
        name: petTemplate.name,
        level: monster.level || 1,
        hp: monsterHp,
        maxHp: monsterHp,
        energy: 0,
        maxEnergy: 0,
        stats: {
          hp: monster.stats?.hp || petTemplate.base_hp_min,
          atk: monster.stats?.atk || petTemplate.base_atk_min,
          def: monster.stats?.def || petTemplate.base_def_min,
          spd: monster.stats?.spd || petTemplate.base_spd_min,
        },
        element: {
          primary: petTemplate.element_primary as ElementType,
          secondary: petTemplate.element_secondary as ElementType | undefined,
          primaryRatio: petTemplate.element_primary_ratio || 100,
        },
        statusEffects: [],
        isCapturable: monster.level === 1,  // 레벨 1만 포획 가능
        captureRate: petTemplate.capture_rate || 50,
        isRareColor: Math.random() < 0.03,  // 3% 희귀 색상
        isAlive: true,
        isDefending: false,
      });
    }

    // Wild pets from stage.wild_pets (JSONB) - 야생 펫 스폰
    const wildPets = stage.wild_pets || [];
    for (const wild of wildPets) {
      // wild: { petId, spawnRate }
      if (Math.random() * 100 > wild.spawnRate) continue;

      const { data: petTemplate } = await supabase
        .from('admin_pets')
        .select('*')
        .eq('id', wild.petId)
        .single();

      if (!petTemplate) continue;

      const eid = uuidv4();
      const wildHp = petTemplate.base_hp_min;

      units.set(eid, {
        id: eid,
        type: 'enemy',
        templateId: petTemplate.id,
        name: petTemplate.name,
        level: 1,  // 야생 펫은 항상 레벨 1
        hp: wildHp,
        maxHp: wildHp,
        energy: 0,
        maxEnergy: 0,
        stats: {
          hp: petTemplate.base_hp_min,
          atk: petTemplate.base_atk_min,
          def: petTemplate.base_def_min,
          spd: petTemplate.base_spd_min,
        },
        element: {
          primary: petTemplate.element_primary as ElementType,
          secondary: petTemplate.element_secondary as ElementType | undefined,
          primaryRatio: petTemplate.element_primary_ratio || 100,
        },
        statusEffects: [],
        isCapturable: true,
        captureRate: petTemplate.capture_rate || 50,
        isRareColor: Math.random() < 0.03,
        isAlive: true,
        isDefending: false,
      });
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

    const actorUnit = battleState.units.get(input.actorId);
    if (actorUnit?.isAlive) {
      if (actorUnit.type === 'pet' && actorUnit.ownerId !== characterId) {
        throw new BattleError('BATTLE_NOT_OWNER', '자신의 펫만 조종할 수 있습니다');
      }

      battleState.pendingActions.set(input.actorId, {
        actorId: input.actorId,
        type: input.type as BattleAction['type'],
        targetId: input.targetId,
        skillId: input.skillId,
        itemId: input.itemId,
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
              templateId: target.templateId || '',
              name: target.name,
              isRareColor: target.isRareColor || false,
            };

            // Save captured pet to DB (4스탯)
            const characterId = battleState.participants[0];
            const petData = captureManager.createCapturedPet(target, characterId);
            const { error: insertError } = await supabase.from('pets').insert({
              template_id: petData.templateId,
              character_id: petData.characterId,
              nickname: petData.nickname,
              level: petData.level,
              exp: petData.exp,
              stat_hp: petData.stat_hp,
              stat_atk: petData.stat_atk,
              stat_def: petData.stat_def,
              stat_spd: petData.stat_spd,
              growth_hp: petData.growth_hp,
              growth_atk: petData.growth_atk,
              growth_def: petData.growth_def,
              growth_spd: petData.growth_spd,
              growth_group: petData.growthGroup,
              loyalty: petData.loyalty,
              is_rare_color: petData.isRareColor,
              is_starter: false,
            });
            if (insertError) {
              console.error('Failed to save captured pet:', insertError);
            }
          }
        }

        // Check for flee
        if (action.type === 'flee') {
          const charUnit = battleState.units.get(action.actorId);
          const enemies = Array.from(battleState.units.values()).filter(
            (u) => u.type === 'enemy' && u.isAlive
          );

          if (enemies.length === 0) {
            battleState.phase = 'victory';
          } else {
            const avgEnemySpd = enemies.reduce((s, e) => s + e.stats.spd, 0) / enemies.length;
            const fleeChance = Math.max(
              10,
              Math.min(90, 30 + (charUnit?.stats.spd || 10) - avgEnemySpd)
            );

            const success = Math.random() * 100 < fleeChance;
            if (success) {
              battleState.phase = 'fled';
              results[results.length - 1].message = `${charUnit?.name} 도주 성공!`;
            } else {
              results[results.length - 1].message = `${charUnit?.name} 도주 실패!`;
            }
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

    // Collect unit updates
    for (const unit of battleState.units.values()) {
      unitUpdates.set(unit.id, {
        hp: unit.hp,
        energy: unit.energy,
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

    // Calculate rewards on victory (체력/기력 회복 없음)
    let rewards: BattleRewards | undefined;
    if (battleState.phase === 'victory') {
      rewards = await this.calculateBattleRewards(battleState);

      // 전투 후 HP/기력 저장 (자동 회복 없음)
      await this.saveBattleResults(battleState);
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
      result: (['victory', 'defeat', 'fled'] as const).includes(battleState.phase as 'victory' | 'defeat' | 'fled')
        ? (battleState.phase as 'victory' | 'defeat' | 'fled')
        : undefined,
      rewards,
    };
  }

  // 전투 결과 저장 (HP/기력 유지, 자동 회복 없음)
  private async saveBattleResults(battleState: BattleState): Promise<void> {
    for (const unit of battleState.units.values()) {
      if (unit.type === 'character') {
        await supabase
          .from('characters')
          .update({
            current_hp: Math.max(0, unit.hp),
            current_energy: Math.max(0, unit.energy),
          })
          .eq('id', unit.id);
      } else if (unit.type === 'pet' && unit.ownerId) {
        await supabase
          .from('pets')
          .update({
            current_hp: Math.max(0, unit.hp),
          })
          .eq('id', unit.id);
      }
    }
  }

  private processAction(
    battleState: BattleState,
    actor: BattleUnit,
    action: BattleAction
  ): ActionResult {
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

    // 회피 계산 (SPD 기반)
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

    // Gang-up bonus
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
      .from('admin_stages')
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
        drops: stage.drops || [],
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

    if (enemies.length === 0) {
      state.phase = 'victory';
      await this.saveBattleState(battleId, state);
      return { success: true, battleState: this.serializeBattleState(state) };
    }

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

export const battleService = new BattleService();

export const startBattle = battleService.startBattle.bind(battleService);
export const submitAction = battleService.submitAction.bind(battleService);
export const processTurn = battleService.processTurn.bind(battleService);
export const getBattleState = battleService.getBattleState.bind(battleService);
export const attemptFlee = battleService.attemptFlee.bind(battleService);
