import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { RefundOrderModule } from './refund-order/refund-order.module';
import { ConfigModule } from './config/config.module';
import { ResponsibilityRuleModule } from './responsibility-rule/responsibility-rule.module';
import { TimeoutModule } from './timeout/timeout.module';
import { ReminderModule } from './reminder/reminder.module';
import { AnalysisModule } from './analysis/analysis.module';
import { TimelineService } from './timeline/timeline.service';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    UsersModule,
    RefundOrderModule,
    ConfigModule,
    ResponsibilityRuleModule,
    TimeoutModule,
    ReminderModule,
    AnalysisModule,
    TimelineModule,
  ],
  providers: [TimelineService],
})
export class AppModule {}
