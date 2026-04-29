import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

// Cache helpers
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    if (data) {
      return JSON.parse(data) as T;
    }
    return null;
  } catch (err) {
    console.error(`[Redis] Failed to get cache for key "${key}":`, err);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: any,
  ttlSeconds: number
): Promise<void> => {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error(`[Redis] Failed to set cache for key "${key}":`, err);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[Redis] Failed to delete cache for key "${key}":`, err);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error(`[Redis] Failed to delete cache pattern "${pattern}":`, err);
  }
};

export default redis;
