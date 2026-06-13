import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);
  private memoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private memoryZset = new Map<string, Map<string, number>>();
  private connected = false;

  constructor() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = new Redis(redisUrl, {
        enableReadyCheck: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryDelayOnFailover: 1000,
        reconnectOnError: () => false,
        connectTimeout: 2000,
        commandTimeout: 2000,
      } as any);

      this.client.on('connect', () => {
        this.connected = true;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.connected = false;
        this.logger.warn(`Redis connection error, using memory fallback: ${err.message}`);
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      this.client.connect().catch(() => {
        this.connected = false;
        this.logger.warn('Redis not available, running with memory store');
      });
    } catch (e) {
      this.connected = false;
      this.logger.warn('Redis initialization failed, running with memory store');
    }
  }

  private isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (data.expiresAt && data.expiresAt < now) {
        this.memoryStore.delete(key);
      }
    }
  }

  getClient(): Redis | null {
    return this.isConnected() ? this.client : null;
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected()) {
      try {
        return await this.client!.get(key);
      } catch {
        // fallback to memory
      }
    }
    this.cleanupExpired();
    const data = this.memoryStore.get(key);
    if (data && (!data.expiresAt || data.expiresAt > Date.now())) {
      return data.value;
    }
    return null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected()) {
      try {
        if (ttlSeconds) {
          await this.client!.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client!.set(key, value);
        }
        return;
      } catch {
        // fallback to memory
      }
    }
    this.memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected()) {
      try {
        await this.client!.del(key);
      } catch {
        // fallback to memory
      }
    }
    this.memoryStore.delete(key);
    this.memoryZset.delete(key);
  }

  async incr(key: string): Promise<number> {
    if (this.isConnected()) {
      try {
        return await this.client!.incr(key);
      } catch {
        // fallback to memory
      }
    }
    this.cleanupExpired();
    const current = this.memoryStore.get(key);
    const value = current ? parseInt(current.value) || 0 : 0;
    const next = value + 1;
    this.memoryStore.set(key, { value: String(next), expiresAt: current?.expiresAt });
    return next;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (this.isConnected()) {
      try {
        const result = await this.client!.expire(key, seconds);
        return result === 1;
      } catch {
        // fallback to memory
      }
    }
    const data = this.memoryStore.get(key);
    if (data) {
      data.expiresAt = Date.now() + seconds * 1000;
      return true;
    }
    return false;
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    if (this.isConnected()) {
      try {
        const result = await this.client!.set(key, '1', 'PX', ttlMs, 'NX');
        return result === 'OK';
      } catch {
        // fallback to memory
      }
    }
    this.cleanupExpired();
    if (this.memoryStore.has(key)) {
      const data = this.memoryStore.get(key)!;
      if (data.expiresAt && data.expiresAt > Date.now()) {
        return false;
      }
    }
    this.memoryStore.set(key, { value: '1', expiresAt: Date.now() + ttlMs });
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    await this.del(key);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (this.isConnected()) {
      try {
        return await this.client!.zadd(key, score, member);
      } catch {
        // fallback to memory
      }
    }
    if (!this.memoryZset.has(key)) {
      this.memoryZset.set(key, new Map());
    }
    this.memoryZset.get(key)!.set(member, score);
    return 1;
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    if (this.isConnected()) {
      try {
        return await this.client!.zrangebyscore(key, min, max);
      } catch {
        // fallback to memory
      }
    }
    const zset = this.memoryZset.get(key);
    if (!zset) return [];
    return Array.from(zset.entries())
      .filter(([_, score]) => score >= min && score <= max)
      .sort((a, b) => a[1] - b[1])
      .map(([member]) => member);
  }

  async zrem(key: string, member: string): Promise<number> {
    if (this.isConnected()) {
      try {
        return await this.client!.zrem(key, member);
      } catch {
        // fallback to memory
      }
    }
    const zset = this.memoryZset.get(key);
    if (zset && zset.has(member)) {
      zset.delete(member);
      return 1;
    }
    return 0;
  }

  async lpush(key: string, value: string): Promise<number> {
    if (this.isConnected()) {
      try {
        return await this.client!.lpush(key, value);
      } catch {
        // fallback to memory
      }
    }
    const current = await this.get(key);
    const list = current ? JSON.parse(current) : [];
    list.unshift(value);
    await this.set(key, JSON.stringify(list));
    return list.length;
  }

  async rpop(key: string): Promise<string | null> {
    if (this.isConnected()) {
      try {
        return await this.client!.rpop(key);
      } catch {
        // fallback to memory
      }
    }
    const current = await this.get(key);
    if (!current) return null;
    const list = JSON.parse(current);
    if (!Array.isArray(list) || list.length === 0) return null;
    const value = list.pop();
    await this.set(key, JSON.stringify(list));
    return value;
  }

  async onModuleDestroy() {
    if (this.client && this.connected) {
      try {
        await this.client.quit();
      } catch (e) {
        // ignore
      }
    }
  }
}
