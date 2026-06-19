import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsService } from './records.service';
import { PrismaService } from '../prisma/prisma.service';
import { PropertiesService } from '../properties/properties.service';
import { CleaningTasksService } from '../cleaning-tasks/cleaning-tasks.service';
import { CheckinDocumentsService } from '../checkin-documents/checkin-documents.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Module({
  controllers: [RecordsController],
  providers: [
    RecordsService,
    PrismaService,
    PropertiesService,
    CleaningTasksService,
    CheckinDocumentsService,
    SystemLogsService,
  ],
})
export class RecordsModule {}
