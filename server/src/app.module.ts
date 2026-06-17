import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ElderModule } from './elder/elder.module';
import { ReminderModule } from './reminder/reminder.module';
import { FallModule } from './fall/fall.module';
import { VisitModule } from './visit/visit.module';
import { ActivityModule } from './activity/activity.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    ElderModule,
    ReminderModule,
    FallModule,
    VisitModule,
    ActivityModule,
    DashboardModule,
    SchedulerModule,
  ],
})
export class AppModule {}
