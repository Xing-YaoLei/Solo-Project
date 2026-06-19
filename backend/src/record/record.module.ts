import { Module } from '@nestjs/common';
import { RecordService } from './record.service';
import { RecordController } from './record.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SponsorModule } from '../sponsor/sponsor.module';
import { VerificationModule } from '../verification/verification.module';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [PrismaModule, SponsorModule, VerificationModule, TicketModule],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService],
})
export class RecordModule {}
