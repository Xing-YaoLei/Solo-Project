import { createClient } from "redis";

let redisClient = null;

export const initRedis = async () => {
  try {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redisClient = createClient({ url });

    redisClient.on("error", (err) => console.error("❌ Redis 客户端错误:", err));
    redisClient.on("connect", () => console.log("✅ Redis 已连接"));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("❌ Redis 连接失败:", error);
    return null;
  }
};

export const getRedisClient = () => redisClient;

export const cacheSet = async (key, value, ttl = 3600) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error("Redis cacheSet 错误:", err);
  }
};

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis cacheGet 错误:", err);
    return null;
  }
};

export const cacheDel = async (key) => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error("Redis cacheDel 错误:", err);
  }
};
