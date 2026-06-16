import { Module } from '@nestjs/common';
import { ReplenishmentOrdersController } from './replenishment-orders.controller';
import { ReplenishmentOrdersService } from './replenishment-orders.service';

@Module({
  controllers: [ReplenishmentOrdersController],
  providers: [ReplenishmentOrdersService],
  exports: [ReplenishmentOrdersService],
})
export class ReplenishmentOrdersModule {}
