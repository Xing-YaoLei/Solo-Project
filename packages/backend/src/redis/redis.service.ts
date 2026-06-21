import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('REDIS_HOST', 'localhost');
    const port = parseInt(this.configService.get('REDIS_PORT', '6379'));
    const password = this.configService.get('REDIS_PASSWORD');

    this.client = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string | Buffer, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const str = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, str, 'EX', ttl);
    } else {
      await this.client.set(key, str);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const str = await this.client.get(key);
    if (!str) return null;
    return JSON.parse(str) as T;
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<Redis> {
    const subscriber = this.client.duplicate();
    subscriber.subscribe(channel, (err) => {
      if (err) throw err;
    });
    subscriber.on('message', (_ch, msg) => callback(msg));
    return subscriber;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
