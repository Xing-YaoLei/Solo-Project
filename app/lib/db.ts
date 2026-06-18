import mongoose from "mongoose";
import Redis from "ioredis";

let mongoConnected = false;
let redisClient: Redis | null = null;

export async function connectToMongo(): Promise<boolean> {
  if (mongoConnected) return true;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️  MONGODB_URI 环境变量未设置，跳过 MongoDB 连接");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
    });
    mongoConnected = true;
    console.log("✅ MongoDB 连接成功");
    return true;
  } catch (error) {
    console.warn("⚠️  MongoDB 连接失败，API 功能将受限:", (error as Error).message);
    return false;
  }
}

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const uri = process.env.REDIS_URI;
  if (!uri) {
    console.warn("⚠️  REDIS_URI 环境变量未设置，跳过 Redis 连接");
    return null;
  }

  try {
    redisClient = new Redis(uri, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis 连接成功");
    });

    redisClient.on("error", (error) => {
      console.warn("⚠️  Redis 连接错误:", (error as Error).message);
    });

    return redisClient;
  } catch (error) {
    console.warn("⚠️  Redis 初始化失败，会话将使用内存存储:", (error as Error).message);
    return null;
  }
}

export function isMongoConnected(): boolean {
  return mongoConnected;
}

export async function disconnect(): Promise<void> {
  if (mongoConnected) {
    await mongoose.disconnect();
    mongoConnected = false;
  }
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export { mongoose };
