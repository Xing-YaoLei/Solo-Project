import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FollowUpTasksModule } from './follow-up-tasks/follow-up-tasks.module';
import { ReplenishmentOrdersModule } from './replenishment-orders/replenishment-orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    FollowUpTasksModule,
    ReplenishmentOrdersModule,
    DashboardModule,
  ],
})
export class AppModule {}
