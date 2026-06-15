import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  return getRedis().get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  await getRedis().set(key, value, "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function cacheIncr(key: string): Promise<number> {
  return getRedis().incr(key);
}
