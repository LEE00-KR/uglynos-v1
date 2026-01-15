import { v4 as uuidv4 } from 'uuid';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { NotFoundError, BattleError } from '../utils/errors.js';
import { StartBattleInput, BattleActionInput } from '../validators/battleValidator.js';

// Battle state interface
interface BattleState {
  id: string;
  stageId: number;
  phase: 'waiting' | 'in_progress' | 'victory' | 'defeat' | 'fled';
  turnNumber: number;
  units: Record<string, BattleUnit>;
  turnOrder: string[];
  currentTurnIndex: number;
  participants: string[];
  turnStartedAt: number;
  turnTimeout: number;
  createdAt: number;
  updatedAt: number;
}

interface BattleUnit {
  id: string;
  type: 'character' | 'pet' | 'enemy';
  templateId?: number;
  ownerId?: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: { atk: number; def: number; spd: number; eva: number };
  element: { primary: string; secondary?: string; primaryRatio: number };
  statusEffects: unknown[];
  isAlive: boolean;
  isDefending: boolean;
}

const TURN_TIMEOUT = 30000; // 30 seconds

export const startBattle = async (characterId: string, input: StartBattleInput) => {
  const battleId = uuidv4();

  // TODO: Load character, pets, and stage data from database
  // For now, create a placeholder battle state

  const battleState: BattleState = {
    id: battleId,
    stageId: input.stageId,
    phase: 'in_progress',
    turnNumber: 1,
    units: {},
    turnOrder: [],
    currentTurnIndex: 0,
    participants: [characterId],
    turnStartedAt: Date.now(),
    turnTimeout: TURN_TIMEOUT,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Store in Redis
  await redis.setex(
    REDIS_KEYS.BATTLE_STATE(battleId),
    3600, // 1 hour TTL
    JSON.stringify(battleState)
  );

  return battleState;
};

export const submitAction = async (characterId: string, input: BattleActionInput) => {
  const battleState = await getBattleStateFromRedis(input.battleId);

  if (!battleState.participants.includes(characterId)) {
    throw new BattleError('BATTLE_NOT_PARTICIPANT', '전투 참가자가 아닙니다');
  }

  if (battleState.phase !== 'in_progress') {
    throw new BattleError('BATTLE_ALREADY_ENDED', '이미 종료된 전투입니다');
  }

  // TODO: Process action and update battle state
  // This will be implemented in detail in Day 5-8

  battleState.updatedAt = Date.now();

  await redis.setex(
    REDIS_KEYS.BATTLE_STATE(input.battleId),
    3600,
    JSON.stringify(battleState)
  );

  return { battleState, actionResult: {} };
};

export const getBattleState = async (battleId: string, characterId: string) => {
  const battleState = await getBattleStateFromRedis(battleId);

  if (!battleState.participants.includes(characterId)) {
    throw new BattleError('BATTLE_NOT_PARTICIPANT', '전투 참가자가 아닙니다');
  }

  return battleState;
};

export const attemptFlee = async (battleId: string, characterId: string) => {
  const battleState = await getBattleStateFromRedis(battleId);

  if (!battleState.participants.includes(characterId)) {
    throw new BattleError('BATTLE_NOT_PARTICIPANT', '전투 참가자가 아닙니다');
  }

  if (battleState.phase !== 'in_progress') {
    throw new BattleError('BATTLE_ALREADY_ENDED', '이미 종료된 전투입니다');
  }

  // Flee success rate based on speed comparison
  // TODO: Implement proper flee logic
  const fleeSuccess = Math.random() < 0.5;

  if (fleeSuccess) {
    battleState.phase = 'fled';
    await redis.setex(
      REDIS_KEYS.BATTLE_STATE(battleId),
      3600,
      JSON.stringify(battleState)
    );
  }

  return { success: fleeSuccess, battleState };
};

async function getBattleStateFromRedis(battleId: string): Promise<BattleState> {
  const data = await redis.get(REDIS_KEYS.BATTLE_STATE(battleId));

  if (!data) {
    throw new NotFoundError('전투');
  }

  return JSON.parse(data);
}
