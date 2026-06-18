import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('BULL_REDIS_HOST', 'localhost'),
          port: configService.get('BULL_REDIS_PORT', 6379),
          password: configService.get('BULL_REDIS_PASSWORD', ''),
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class BullQueueModule {}
