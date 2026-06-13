import { Module } from '@nestjs/common';
import { TimeoutService } from './timeout.service';
import { TimeoutController } from './timeout.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { RefundOrderModule } from '../refund-order/refund-order.module';
import { ReminderModule } from '../reminder/reminder.module';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [PrismaModule, RedisModule, RefundOrderModule, ReminderModule, TimelineModule],
  controllers: [TimeoutController],
  providers: [TimeoutService],
  exports: [TimeoutService],
})
export class TimeoutModule {}
