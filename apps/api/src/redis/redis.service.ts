import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis
  private logger = new Logger('RedisService')

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    this.client = new Redis(redisUrl)

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully')
    })

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err)
    })
  }

  onModuleDestroy() {
    this.client.quit()
  }

  getClient(): Redis {
    return this.client
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field)
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value)
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    await this.client.hdel(key, ...fields)
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member)
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop)
  }
}
