import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private logger = new Logger(RedisService.name);

  onModuleInit() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      this.client.connect().catch(() => {
        this.logger.warn('Redis 连接不可用，将降级为内存缓存');
      });
    } catch (e) {
      this.logger.warn('Redis 初始化失败');
    }
  }

  private get connected(): boolean {
    return this.client && this.client.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    if (!this.connected) return;
    if (ttlSec) {
      await this.client.setex(key, ttlSec, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;
    await this.client.del(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async setJson<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSec);
  }
}
