import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { PerformanceModule } from './performance/performance.module';
import { TaskModule } from './task/task.module';
import { OrderModule } from './order/order.module';
import { SponsorModule } from './sponsor/sponsor.module';
import { TicketModule } from './ticket/ticket.module';
import { VerificationModule } from './verification/verification.module';
import { DisputeModule } from './dispute/dispute.module';
import { RecordModule } from './record/record.module';
import { SystemLogModule } from './system-log/system-log.module';
import { NotificationModule } from './notification/notification.module';
import { ExportModule } from './export/export.module';
import { ReviewModule } from './review/review.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    UserModule,
    PerformanceModule,
    TaskModule,
    OrderModule,
    SponsorModule,
    TicketModule,
    VerificationModule,
    DisputeModule,
    RecordModule,
    SystemLogModule,
    NotificationModule,
    ExportModule,
    ReviewModule,
  ],
})
export class AppModule {}
