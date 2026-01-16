import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

// Battle unit interface
export interface BattleUnit {
  id: string;
  type: 'character' | 'pet' | 'enemy';
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: {
    atk: number;
    def: number;
    spd: number;
    eva: number;
  };
  element: {
    primary: string;
    secondary?: string;
    primaryRatio: number;
  };
  statusEffects: StatusEffect[];
  isAlive: boolean;
  isDefending: boolean;
  isCapturable?: boolean;
  isRareColor?: boolean;
  loyalty?: number;
  isRepresentative?: boolean;
  isRiding?: boolean;
  templateId?: number;
}

export interface StatusEffect {
  type: string;
  remainingTurns: number;
}

export interface BattleAction {
  actorId: string;
  type: 'attack' | 'defend' | 'magic' | 'item' | 'capture' | 'wait' | 'flee';
  targetId?: string;
  spellId?: number;
  itemId?: string;
  skillId?: number;
}

export interface ActionResult {
  actorId: string;
  actionType: string;
  targetId?: string;
  damage?: number;
  healing?: number;
  isCritical?: boolean;
  isMiss?: boolean;
  statusApplied?: string;
  message?: string;
}

export interface TurnResult {
  turnNumber: number;
  actions: ActionResult[];
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

export interface BattleRewards {
  exp: { characterId: string; exp: number }[];
  gold: number;
  drops: { itemType: string; itemId: number; quantity: number }[];
  stars: number;
}

export interface BattleState {
  // Battle state
  battleId: string | null;
  stageId: number | null;
  phase: 'idle' | 'loading' | 'waiting' | 'in_progress' | 'victory' | 'defeat' | 'fled';
  turnNumber: number;

  // Units
  units: Map<string, BattleUnit>;
  turnOrder: string[];
  currentTurnIndex: number;

  // Actions
  pendingActions: Map<string, BattleAction>;
  selectedAction: BattleAction | null;
  selectedTargetId: string | null;

  // Results
  lastTurnResult: TurnResult | null;
  rewards: BattleRewards | null;

  // UI state
  isSubmitting: boolean;
  showTargetSelection: boolean;
  showSkillMenu: boolean;
  showItemMenu: boolean;
  actionMessages: string[];

  // Socket
  socket: Socket | null;
}

interface BattleActions {
  // Initialize
  setSocket: (socket: Socket) => void;
  initBattle: (data: {
    battleId: string;
    stageId: number;
    units: BattleUnit[];
    turnOrder: string[];
  }) => void;

  // Actions
  selectAction: (action: BattleAction) => void;
  selectTarget: (targetId: string) => void;
  submitActions: () => Promise<void>;
  cancelAction: () => void;

  // UI
  toggleTargetSelection: (show: boolean) => void;
  toggleSkillMenu: (show: boolean) => void;
  toggleItemMenu: (show: boolean) => void;
  addMessage: (message: string) => void;
  clearMessages: () => void;

  // Updates
  updateTurn: (result: TurnResult) => void;
  updateUnit: (unitId: string, updates: Partial<BattleUnit>) => void;
  endBattle: (result: 'victory' | 'defeat' | 'fled', rewards?: BattleRewards) => void;
  reset: () => void;
}

const initialState: BattleState = {
  battleId: null,
  stageId: null,
  phase: 'idle',
  turnNumber: 0,
  units: new Map(),
  turnOrder: [],
  currentTurnIndex: 0,
  pendingActions: new Map(),
  selectedAction: null,
  selectedTargetId: null,
  lastTurnResult: null,
  rewards: null,
  isSubmitting: false,
  showTargetSelection: false,
  showSkillMenu: false,
  showItemMenu: false,
  actionMessages: [],
  socket: null,
};

export const useBattleStore = create<BattleState & BattleActions>((set, get) => ({
  ...initialState,

  setSocket: (socket) => {
    set({ socket });

    // Setup socket listeners
    socket.on('battle:turn_result', (result: TurnResult) => {
      get().updateTurn(result);
    });

    socket.on('battle:ended', (data: { result: 'victory' | 'defeat' | 'fled'; rewards?: BattleRewards }) => {
      get().endBattle(data.result, data.rewards);
    });

    socket.on('battle:unit_update', (data: { unitId: string; updates: Partial<BattleUnit> }) => {
      get().updateUnit(data.unitId, data.updates);
    });
  },

  initBattle: (data) => {
    const unitsMap = new Map<string, BattleUnit>();
    data.units.forEach(unit => unitsMap.set(unit.id, unit));

    set({
      battleId: data.battleId,
      stageId: data.stageId,
      phase: 'in_progress',
      turnNumber: 1,
      units: unitsMap,
      turnOrder: data.turnOrder,
      currentTurnIndex: 0,
      pendingActions: new Map(),
      selectedAction: null,
      selectedTargetId: null,
      lastTurnResult: null,
      rewards: null,
      isSubmitting: false,
      actionMessages: ['전투 시작!'],
    });
  },

  selectAction: (action) => {
    // Check if action needs target selection
    const needsTarget = ['attack', 'magic', 'capture'].includes(action.type);

    set({
      selectedAction: action,
      showTargetSelection: needsTarget,
      showSkillMenu: false,
      showItemMenu: false,
    });
  },

  selectTarget: (targetId) => {
    const state = get();
    if (!state.selectedAction) return;

    const actionWithTarget = {
      ...state.selectedAction,
      targetId,
    };

    // Add to pending actions
    const newPending = new Map(state.pendingActions);
    newPending.set(actionWithTarget.actorId, actionWithTarget);

    set({
      pendingActions: newPending,
      selectedAction: null,
      selectedTargetId: null,
      showTargetSelection: false,
    });
  },

  submitActions: async () => {
    const state = get();
    if (!state.socket || !state.battleId || state.isSubmitting) return;

    set({ isSubmitting: true });

    try {
      const actions = Array.from(state.pendingActions.values());

      state.socket.emit('battle:submit_actions', {
        battleId: state.battleId,
        actions,
      });

      // Wait for turn result via socket event
    } catch (error) {
      console.error('Failed to submit actions:', error);
      set({ isSubmitting: false });
    }
  },

  cancelAction: () => {
    set({
      selectedAction: null,
      selectedTargetId: null,
      showTargetSelection: false,
      showSkillMenu: false,
      showItemMenu: false,
    });
  },

  toggleTargetSelection: (show) => set({ showTargetSelection: show }),
  toggleSkillMenu: (show) => set({ showSkillMenu: show, showItemMenu: false }),
  toggleItemMenu: (show) => set({ showItemMenu: show, showSkillMenu: false }),

  addMessage: (message) => {
    set(state => ({
      actionMessages: [...state.actionMessages.slice(-9), message],
    }));
  },

  clearMessages: () => set({ actionMessages: [] }),

  updateTurn: (result) => {
    const state = get();
    const updatedUnits = new Map(state.units);

    // Apply unit updates (서버에서 객체로 전송됨)
    if (result.unitUpdates) {
      Object.entries(result.unitUpdates).forEach(([unitId, updates]) => {
        const unit = updatedUnits.get(unitId);
        if (unit) {
          updatedUnits.set(unitId, { ...unit, ...(updates as object) });
        }
      });
    }

    // Mark defeated units
    const defeatedUnits = result.defeatedUnits || [];
    defeatedUnits.forEach((unitId: string) => {
      const unit = updatedUnits.get(unitId);
      if (unit) {
        updatedUnits.set(unitId, { ...unit, hp: 0, isAlive: false });
      }
    });

    // Add action messages
    const messages: string[] = [];
    const actions = result.actions || [];
    actions.forEach((action: any) => {
      const actor = updatedUnits.get(action.actorId);
      const target = action.targetId ? updatedUnits.get(action.targetId) : null;

      let msg = '';
      if (action.isMiss) {
        msg = `${actor?.name}의 공격이 빗나갔다!`;
      } else if (action.damage) {
        msg = `${actor?.name}이(가) ${target?.name}에게 ${action.damage} 데미지!`;
        if (action.isCritical) msg += ' 크리티컬!';
      } else if (action.healing) {
        msg = `${actor?.name}이(가) ${action.healing} HP 회복!`;
      } else if (action.message) {
        msg = action.message;
      }
      if (msg) messages.push(msg);
    });

    // Captured pet message and remove from battle
    if (result.capturedPet) {
      messages.push(`${result.capturedPet.name}을(를) 포획했다!`);
      // Remove captured pet from enemy units
      updatedUnits.forEach((unit, unitId) => {
        if (unit.type === 'enemy' && unit.templateId === result.capturedPet?.templateId && unit.name === result.capturedPet?.name) {
          updatedUnits.delete(unitId);
        }
      });
    }

    set({
      turnNumber: result.turnNumber,
      units: updatedUnits,
      lastTurnResult: result,
      pendingActions: new Map(),
      isSubmitting: false,
      actionMessages: [...state.actionMessages.slice(-5), ...messages],
    });

    if (result.battleEnded && result.result) {
      get().endBattle(result.result, result.rewards);
    }
  },

  updateUnit: (unitId, updates) => {
    set(state => {
      const newUnits = new Map(state.units);
      const unit = newUnits.get(unitId);
      if (unit) {
        newUnits.set(unitId, { ...unit, ...updates });
      }
      return { units: newUnits };
    });
  },

  endBattle: (result, rewards) => {
    set({
      phase: result,
      rewards: rewards || null,
      isSubmitting: false,
    });

    const newMessages: string[] = [];
    if (result === 'victory') {
      newMessages.push('전투 승리!');
      if (rewards) {
        newMessages.push(`획득 골드: ${rewards.gold}`);
        rewards.exp.forEach(exp => {
          newMessages.push(`EXP +${exp.exp}`);
        });
        newMessages.push(`★ ${rewards.stars}개 획득!`);
      }
    } else if (result === 'defeat') {
      newMessages.push('전투 패배...');
    } else if (result === 'fled') {
      newMessages.push('도망쳤다!');
    }

    set(state => ({
      actionMessages: [...state.actionMessages, ...newMessages],
    }));
  },

  reset: () => {
    const state = get();
    const socket = state.socket; // 소켓 참조 보존

    // 기존 리스너 제거
    if (socket) {
      socket.off('battle:turn_result');
      socket.off('battle:ended');
      socket.off('battle:unit_update');
    }

    // 상태 초기화 (소켓은 유지)
    set({
      ...initialState,
      socket: socket,
    });

    // 소켓 리스너 재등록
    if (socket) {
      socket.on('battle:turn_result', (result: TurnResult) => {
        get().updateTurn(result);
      });

      socket.on('battle:ended', (data: { result: 'victory' | 'defeat' | 'fled'; rewards?: BattleRewards }) => {
        get().endBattle(data.result, data.rewards);
      });

      socket.on('battle:unit_update', (data: { unitId: string; updates: Partial<BattleUnit> }) => {
        get().updateUnit(data.unitId, data.updates);
      });
    }
  },
}));

// Selector helpers
export const selectAllies = (state: BattleState) =>
  Array.from(state.units.values()).filter(u => u.type !== 'enemy' && u.isAlive);

export const selectEnemies = (state: BattleState) =>
  Array.from(state.units.values()).filter(u => u.type === 'enemy' && u.isAlive);

export const selectCurrentUnit = (state: BattleState) => {
  if (state.turnOrder.length === 0) return null;
  const unitId = state.turnOrder[state.currentTurnIndex];
  return state.units.get(unitId) || null;
};
