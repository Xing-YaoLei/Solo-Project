import Redis from "ioredis";

let redis: Redis | null = null;
let mockMode = false;
const mockStore = new Map<string, string>();

function getMockRedis(): { get: (k: string) => Promise<string | null>; set: (k: string, v: string, ...args: any[]) => Promise<string>; del: (...keys: string[]) => Promise<number>; incr: (k: string) => Promise<number> } {
  return {
    get: async (k: string) => mockStore.get(k) ?? null,
    set: async (k: string, v: string, ...args: any[]) => {
      mockStore.set(k, v);
      if (args.length >= 2 && args[0] === "EX") {
        const ttl = Number(args[1]);
        if (!isNaN(ttl) && ttl > 0) {
          setTimeout(() => mockStore.delete(k), ttl * 1000);
        }
      }
      return "OK";
    },
    del: async (...keys: string[]) => {
      let count = 0;
      for (const k of keys) if (mockStore.delete(k)) count++;
      return count;
    },
    incr: async (k: string) => {
      const cur = Number(mockStore.get(k) || "0");
      const next = cur + 1;
      mockStore.set(k, String(next));
      return next;
    },
  };
}

function getClient(): any {
  if (mockMode) return getMockRedis();
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      redis.on("error", () => {
        mockMode = true;
        redis = null;
        console.log("⚠️  Redis 连接失败，已切换到内存缓存");
      });
      redis.connect().catch(() => {
        mockMode = true;
        redis = null;
      });
    } catch {
      mockMode = true;
    }
  }
  return redis || getMockRedis();
}

export function isRedisMockMode(): boolean {
  return mockMode;
}

export function getRedis(): any {
  return getClient();
}

export async function cacheGet(key: string): Promise<string | null> {
  return getClient().get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds = 300): Promise<void> {
  await getClient().set(key, value, "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await getClient().del(key);
}

export async function cacheIncr(key: string): Promise<number> {
  return getClient().incr(key);
}
