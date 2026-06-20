import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';

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
    CommonModule,
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
})
export class AppModule {}
