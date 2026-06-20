import { Module } from '@nestjs/common';
import { TicketTypeController } from './ticket-type.controller';
import { TicketTypeService } from './ticket-type.service';

@Module({
  controllers: [TicketTypeController],
  providers: [TicketTypeService],
  exports: [TicketTypeService],
})
export class TicketTypeModule {}
