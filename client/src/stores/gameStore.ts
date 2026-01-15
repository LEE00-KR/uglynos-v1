import { create } from 'zustand';

interface Character {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  gold: number;
  stat_str: number;
  stat_agi: number;
  stat_vit: number;
  stat_con: number;
  stat_int: number;
  stat_points: number;
  element_primary: string;
  element_secondary?: string;
  element_primary_ratio: number;
}

interface Pet {
  id: string;
  nickname: string | null;
  level: number;
  loyalty: number;
  party_slot: number | null;
  is_riding: boolean;
  template: {
    name: string;
    element_primary: string;
  };
}

interface GameState {
  character: Character | null;
  pets: Pet[];
  currentStage: number | null;
  isBattling: boolean;

  setCharacter: (character: Character) => void;
  setPets: (pets: Pet[]) => void;
  setCurrentStage: (stageId: number | null) => void;
  setIsBattling: (isBattling: boolean) => void;
  updateCharacter: (updates: Partial<Character>) => void;
}

export const useGameStore = create<GameState>((set) => ({
  character: null,
  pets: [],
  currentStage: null,
  isBattling: false,

  setCharacter: (character) => set({ character }),
  setPets: (pets) => set({ pets }),
  setCurrentStage: (stageId) => set({ currentStage: stageId }),
  setIsBattling: (isBattling) => set({ isBattling }),

  updateCharacter: (updates) =>
    set((state) => ({
      character: state.character ? { ...state.character, ...updates } : null,
    })),
}));
