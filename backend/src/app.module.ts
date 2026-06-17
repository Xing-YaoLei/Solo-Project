import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RepairOrderModule } from './repair-order/repair-order.module';
import { MaterialModule } from './material/material.module';
import { RepairPersonModule } from './repair-person/repair-person.module';
import { StatisticsModule } from './statistics/statistics.module';
import { RoutePlanModule } from './route-plan/route-plan.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    RepairOrderModule,
    MaterialModule,
    RepairPersonModule,
    StatisticsModule,
    RoutePlanModule,
  ],
})
export class AppModule {}
