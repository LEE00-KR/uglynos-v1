import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

export const REDIS_KEYS = {
  SESSION: (userId: string) => `session:${userId}`,
  BATTLE: (battleId: string) => `battle:${battleId}`,
  BATTLE_STATE: (battleId: string) => `battle:${battleId}:state`,
  BATTLE_ACTIONS: (battleId: string) => `battle:${battleId}:actions`,
  BATTLE_TIMER: (battleId: string) => `battle:${battleId}:timer`,
  PARTY: (partyId: string) => `party:${partyId}`,
  PARTY_MEMBERS: (partyId: string) => `party:${partyId}:members`,
  PARTY_WAITING: () => 'party:waiting',
  CACHE_STAGE: (stageId: number) => `cache:stage:${stageId}`,
  CACHE_SHOP: () => 'cache:shop',
  CACHE_RECIPES: () => 'cache:recipes',
  TEMPLATE: (type: string, id: number) => `template:${type}:${id}`,
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
  ONLINE_USERS: () => 'online:users',
  USER_SOCKET: (userId: string) => `socket:${userId}`,
};
