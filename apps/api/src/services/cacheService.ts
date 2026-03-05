import Redis from "ioredis";
import { LRUCache } from "lru-cache";
import { env } from "../config/env.js";

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
}

class InMemoryCache implements CacheAdapter {
  private cache = new LRUCache<string, unknown>({ max: 2000 });

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    return (item as T) ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds = env.CACHE_TTL_SECONDS): Promise<void> {
    this.cache.set(key, value, { ttl: ttlSeconds * 1000 });
  }
}

class RedisCache implements CacheAdapter {
  constructor(private readonly client: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = env.CACHE_TTL_SECONDS): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }
}

const buildCache = (): CacheAdapter => {
  if (env.ENABLE_REDIS_CACHE && env.REDIS_URL) {
    const redis = new Redis(env.REDIS_URL);
    return new RedisCache(redis);
  }

  return new InMemoryCache();
};

export const cache = buildCache();