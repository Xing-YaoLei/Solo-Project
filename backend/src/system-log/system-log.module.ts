import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { SystemLogController } from './system-log.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemLogController],
  providers: [SystemLogService],
  exports: [SystemLogService],
})
export class SystemLogModule {}
