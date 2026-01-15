import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
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
          const response = await axios.post('/api/auth/refresh', { refreshToken });
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
  get: (id: string) => api.get(`/pets/${id}`),
  updateNickname: (id: string, nickname: string) =>
    api.patch(`/pets/${id}/nickname`, { nickname }),
  addToParty: (id: string, slot: number) =>
    api.post(`/pets/${id}/party`, { slot }),
  removeFromParty: (id: string) => api.delete(`/pets/${id}/party`),
  setRiding: (id: string) => api.post(`/pets/${id}/ride`),
  unsetRiding: (id: string) => api.delete(`/pets/${id}/ride`),
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
