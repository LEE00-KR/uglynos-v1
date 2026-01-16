import { create } from 'zustand';
import { adminApi } from '../services/api';
import type { AdminPet, AdminSkill, AdminStageGroup, AdminStage, AdminShopItem } from '../types/admin';

interface AdminState {
  // Data
  pets: AdminPet[];
  skills: AdminSkill[];
  stageGroups: AdminStageGroup[];
  stages: AdminStage[];
  shopItems: AdminShopItem[];

  // Loading states
  loading: boolean;
  error: string | null;

  // Actions
  fetchPets: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchStageGroups: () => Promise<void>;
  fetchStages: () => Promise<void>;
  fetchShopItems: () => Promise<void>;

  // CRUD for Pets
  createPet: (pet: Omit<AdminPet, 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePet: (id: string, data: Partial<AdminPet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;

  // CRUD for Skills
  createSkill: (skill: Omit<AdminSkill, 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSkill: (id: string, data: Partial<AdminSkill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  // CRUD for Stage Groups
  createStageGroup: (group: Omit<AdminStageGroup, 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateStageGroup: (id: string, data: Partial<AdminStageGroup>) => Promise<void>;
  deleteStageGroup: (id: string) => Promise<void>;

  // CRUD for Stages
  createStage: (stage: Omit<AdminStage, 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateStage: (id: string, data: Partial<AdminStage>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;

  // CRUD for Shop Items
  createShopItem: (item: Omit<AdminShopItem, 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateShopItem: (id: string, data: Partial<AdminShopItem>) => Promise<void>;
  deleteShopItem: (id: string) => Promise<void>;

  // Clear error
  clearError: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  pets: [],
  skills: [],
  stageGroups: [],
  stages: [],
  shopItems: [],
  loading: false,
  error: null,

  // Fetch methods
  fetchPets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.getPets();
      set({ pets: response.data.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch pets', loading: false });
    }
  },

  fetchSkills: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.getSkills();
      set({ skills: response.data.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch skills', loading: false });
    }
  },

  fetchStageGroups: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.getStageGroups();
      set({ stageGroups: response.data.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch stage groups', loading: false });
    }
  },

  fetchStages: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.getStages();
      set({ stages: response.data.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch stages', loading: false });
    }
  },

  fetchShopItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.getShopItems();
      set({ shopItems: response.data.data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch shop items', loading: false });
    }
  },

  // Pet CRUD
  createPet: async (pet) => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.createPet(pet);
      await get().fetchPets();
      return response.data.data.id;
    } catch (error) {
      set({ error: 'Failed to create pet', loading: false });
      throw error;
    }
  },

  updatePet: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await adminApi.updatePet(id, data);
      await get().fetchPets();
    } catch (error) {
      set({ error: 'Failed to update pet', loading: false });
      throw error;
    }
  },

  deletePet: async (id) => {
    set({ loading: true, error: null });
    try {
      await adminApi.deletePet(id);
      set((state) => ({
        pets: state.pets.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete pet', loading: false });
      throw error;
    }
  },

  // Skill CRUD
  createSkill: async (skill) => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.createSkill(skill);
      await get().fetchSkills();
      return response.data.data.id;
    } catch (error) {
      set({ error: 'Failed to create skill', loading: false });
      throw error;
    }
  },

  updateSkill: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await adminApi.updateSkill(id, data);
      await get().fetchSkills();
    } catch (error) {
      set({ error: 'Failed to update skill', loading: false });
      throw error;
    }
  },

  deleteSkill: async (id) => {
    set({ loading: true, error: null });
    try {
      await adminApi.deleteSkill(id);
      set((state) => ({
        skills: state.skills.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete skill', loading: false });
      throw error;
    }
  },

  // Stage Group CRUD
  createStageGroup: async (group) => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.createStageGroup(group);
      await get().fetchStageGroups();
      return response.data.data.id;
    } catch (error) {
      set({ error: 'Failed to create stage group', loading: false });
      throw error;
    }
  },

  updateStageGroup: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await adminApi.updateStageGroup(id, data);
      await get().fetchStageGroups();
    } catch (error) {
      set({ error: 'Failed to update stage group', loading: false });
      throw error;
    }
  },

  deleteStageGroup: async (id) => {
    set({ loading: true, error: null });
    try {
      await adminApi.deleteStageGroup(id);
      set((state) => ({
        stageGroups: state.stageGroups.filter((g) => g.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete stage group', loading: false });
      throw error;
    }
  },

  // Stage CRUD
  createStage: async (stage) => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.createStage(stage);
      await get().fetchStages();
      return response.data.data.id;
    } catch (error) {
      set({ error: 'Failed to create stage', loading: false });
      throw error;
    }
  },

  updateStage: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await adminApi.updateStage(id, data);
      await get().fetchStages();
    } catch (error) {
      set({ error: 'Failed to update stage', loading: false });
      throw error;
    }
  },

  deleteStage: async (id) => {
    set({ loading: true, error: null });
    try {
      await adminApi.deleteStage(id);
      set((state) => ({
        stages: state.stages.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete stage', loading: false });
      throw error;
    }
  },

  // Shop Item CRUD
  createShopItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const response = await adminApi.createShopItem(item);
      await get().fetchShopItems();
      return response.data.data.id;
    } catch (error) {
      set({ error: 'Failed to create shop item', loading: false });
      throw error;
    }
  },

  updateShopItem: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await adminApi.updateShopItem(id, data);
      await get().fetchShopItems();
    } catch (error) {
      set({ error: 'Failed to update shop item', loading: false });
      throw error;
    }
  },

  deleteShopItem: async (id) => {
    set({ loading: true, error: null });
    try {
      await adminApi.deleteShopItem(id);
      set((state) => ({
        shopItems: state.shopItems.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete shop item', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
