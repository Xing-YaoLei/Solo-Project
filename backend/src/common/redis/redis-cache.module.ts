import { Module, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import type { Cache } from 'cache-manager';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: (await redisStore({
          socket: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
          password: configService.get('REDIS_PASSWORD', '') || undefined,
          database: configService.get('REDIS_DB', 0),
        })) as any,
        ttl: configService.get('CACHE_TTL', 300),
      }),
      isGlobal: true,
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
}
