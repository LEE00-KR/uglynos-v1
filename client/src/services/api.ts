import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Use environment variable for production, fallback to '/api' for development (Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            accessToken,
            newRefreshToken
          );

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Character API
export const characterApi = {
  getAll: () => api.get('/characters'),
  get: (id: string) => api.get(`/characters/${id}`),
  create: (data: unknown) => api.post('/characters', data),
  select: (id: string) => api.post(`/characters/${id}/select`),
  distributeStats: (id: string, stats: unknown) =>
    api.patch(`/characters/${id}/stats`, { stats }),
};

// Pet API
export const petApi = {
  getAll: () => api.get('/pets'),
  getActive: () => api.get('/pets/active'),
  getStorage: () => api.get('/pets/storage'),
  getStandby: () => api.get('/pets/standby'),
  getRepresentative: () => api.get('/pets/representative'),
  get: (id: string) => api.get(`/pets/${id}`),
  updateNickname: (id: string, nickname: string) =>
    api.patch(`/pets/${id}/nickname`, { nickname }),
  addToParty: (id: string, slot: number) =>
    api.post(`/pets/${id}/party`, { slot }),
  removeFromParty: (id: string) => api.delete(`/pets/${id}/party`),
  setRiding: (id: string) => api.post(`/pets/${id}/ride`),
  unsetRiding: (id: string) => api.delete(`/pets/${id}/ride`),
  moveToStorage: (id: string) => api.post(`/pets/${id}/storage`),
  moveFromStorage: (id: string) => api.delete(`/pets/${id}/storage`),
  setRepresentative: (id: string) => api.post(`/pets/${id}/representative`),
  unsetRepresentative: (id: string) => api.delete(`/pets/${id}/representative`),
  setStandbySlot: (id: string, slot: number) =>
    api.post(`/pets/${id}/standby`, { slot }),
  clearStandbySlot: (id: string) => api.delete(`/pets/${id}/standby`),
  release: (id: string) => api.delete(`/pets/${id}`),
};

// Battle API
export const battleApi = {
  start: (stageId: number, partyPetIds: string[], ridingPetId?: string) =>
    api.post('/battles/start', { stageId, partyPetIds, ridingPetId }),
  submitAction: (data: unknown) => api.post('/battles/action', data),
  getState: (id: string) => api.get(`/battles/${id}`),
  flee: (id: string) => api.post(`/battles/${id}/flee`),
};

// Stage API
export const stageApi = {
  getAll: () => api.get('/stages'),
  get: (id: number) => api.get(`/stages/${id}`),
  getProgress: (id: number) => api.get(`/stages/${id}/progress`),
};

// Inventory API
export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getEquipped: () => api.get('/inventory/equipped'),
  equip: (inventoryId: string) => api.post(`/inventory/${inventoryId}/equip`),
  unequip: (inventoryId: string) => api.post(`/inventory/${inventoryId}/unequip`),
  use: (inventoryId: string) => api.post(`/inventory/${inventoryId}/use`),
  sell: (inventoryId: string, quantity?: number) =>
    api.post(`/inventory/${inventoryId}/sell`, { quantity }),
  discard: (inventoryId: string, quantity?: number) =>
    api.delete(`/inventory/${inventoryId}`, { data: { quantity } }),
};

// Shop API
export const shopApi = {
  getAll: () => api.get('/shops'),
  get: (shopId: number) => api.get(`/shops/${shopId}`),
  getItems: (shopId: number) => api.get(`/shops/${shopId}/items`),
  buy: (shopId: number, itemTemplateId: number, quantity?: number) =>
    api.post(`/shops/${shopId}/buy`, { itemTemplateId, quantity }),
  getNPCs: () => api.get('/shops/npcs/all'),
  getNPC: (npcId: number) => api.get(`/shops/npcs/${npcId}`),
};

// Admin API
export const adminApi = {
  // Pets
  getPets: () => api.get('/admin/pets'),
  getPet: (id: string) => api.get(`/admin/pets/${id}`),
  createPet: (data: unknown) => api.post('/admin/pets', data),
  updatePet: (id: string, data: unknown) => api.put(`/admin/pets/${id}`, data),
  deletePet: (id: string) => api.delete(`/admin/pets/${id}`),

  // Skills
  getSkills: () => api.get('/admin/skills'),
  getSkill: (id: string) => api.get(`/admin/skills/${id}`),
  createSkill: (data: unknown) => api.post('/admin/skills', data),
  updateSkill: (id: string, data: unknown) => api.put(`/admin/skills/${id}`, data),
  deleteSkill: (id: string) => api.delete(`/admin/skills/${id}`),

  // Stage Groups
  getStageGroups: () => api.get('/admin/stage-groups'),
  getStageGroup: (id: string) => api.get(`/admin/stage-groups/${id}`),
  createStageGroup: (data: unknown) => api.post('/admin/stage-groups', data),
  updateStageGroup: (id: string, data: unknown) => api.put(`/admin/stage-groups/${id}`, data),
  deleteStageGroup: (id: string) => api.delete(`/admin/stage-groups/${id}`),

  // Stages
  getStages: () => api.get('/admin/stages'),
  getStage: (id: string) => api.get(`/admin/stages/${id}`),
  createStage: (data: unknown) => api.post('/admin/stages', data),
  updateStage: (id: string, data: unknown) => api.put(`/admin/stages/${id}`, data),
  deleteStage: (id: string) => api.delete(`/admin/stages/${id}`),

  // Shop Items
  getShopItems: () => api.get('/admin/shop-items'),
  getShopItem: (id: string) => api.get(`/admin/shop-items/${id}`),
  createShopItem: (data: unknown) => api.post('/admin/shop-items', data),
  updateShopItem: (id: string, data: unknown) => api.put(`/admin/shop-items/${id}`, data),
  deleteShopItem: (id: string) => api.delete(`/admin/shop-items/${id}`),
};
