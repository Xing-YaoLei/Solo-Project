import { Module } from '@nestjs/common';
import { CleaningTasksController } from './cleaning-tasks.controller';
import { CleaningTasksService } from './cleaning-tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Module({
  controllers: [CleaningTasksController],
  providers: [CleaningTasksService, PrismaService, SystemLogsService],
  exports: [CleaningTasksService],
})
export class CleaningTasksModule {}
