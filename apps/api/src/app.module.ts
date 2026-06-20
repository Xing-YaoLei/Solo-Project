import { Module } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import { RedisService } from './common/redis/redis.service';
import { StatusHistoryService } from './common/status-history/status-history.service';

import { ActivityModule } from './modules/activity/activity.module';
import { TicketTypeModule } from './modules/ticket-type/ticket-type.module';
import { OrderModule } from './modules/order/order.module';
import { SeatModule } from './modules/seat/seat.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { SponsorModule } from './modules/sponsor/sponsor.module';
import { ExceptionModule } from './modules/exception/exception.module';
import { ExportModule } from './modules/export/export.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ActivityModule,
    TicketTypeModule,
    OrderModule,
    SeatModule,
    CheckInModule,
    SponsorModule,
    ExceptionModule,
    ExportModule,
    DashboardModule,
  ],
  providers: [PrismaService, RedisService, StatusHistoryService],
  exports: [PrismaService, RedisService, StatusHistoryService],
})
export class AppModule {}
