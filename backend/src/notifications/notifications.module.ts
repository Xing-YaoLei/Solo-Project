import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService, RedisService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
