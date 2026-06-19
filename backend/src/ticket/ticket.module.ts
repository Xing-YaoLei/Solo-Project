import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogModule } from '../system-log/system-log.module';

@Module({
  imports: [PrismaModule, SystemLogModule],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
