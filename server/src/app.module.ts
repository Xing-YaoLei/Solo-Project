import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventModule } from './modules/event/event.module';
import { SeatMapModule } from './modules/seat-map/seat-map.module';
import { TicketTypeModule } from './modules/ticket-type/ticket-type.module';
import { OrderModule } from './modules/order/order.module';
import { CheckInDictModule } from './modules/check-in-dict/check-in-dict.module';
import { RefundRuleModule } from './modules/refund-rule/refund-rule.module';
import { DisputeModule } from './modules/dispute/dispute.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [EventModule, SeatMapModule, TicketTypeModule, OrderModule, CheckInDictModule, RefundRuleModule, DisputeModule, OperationLogModule, StatisticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
