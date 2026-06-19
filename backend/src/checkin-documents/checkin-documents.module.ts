import { Module } from '@nestjs/common';
import { CheckinDocumentsController } from './checkin-documents.controller';
import { CheckinDocumentsService } from './checkin-documents.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CheckinDocumentsController],
  providers: [CheckinDocumentsService, PrismaService],
  exports: [CheckinDocumentsService],
})
export class CheckinDocumentsModule {}
