import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redis.set(key, value, 'EX', ttl);
    }
    return this.redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.redis.decr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<'OK'> {
    const strValue = JSON.stringify(value);
    return this.set(key, strValue, ttl);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redis.hset(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.redis.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    return this.redis.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.redis.llen(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redis.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.redis.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return this.redis.sismember(key, member);
  }

  getClient(): Redis {
    return this.redis;
  }
}
