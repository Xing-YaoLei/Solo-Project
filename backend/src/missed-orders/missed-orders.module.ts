import { Module } from '@nestjs/common';
import { MissedOrdersController } from './missed-orders.controller';
import { MissedOrdersService } from './missed-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [MissedOrdersController],
  providers: [MissedOrdersService, PrismaService, NotificationsService, RedisService],
  exports: [MissedOrdersService],
})
export class MissedOrdersModule {}
