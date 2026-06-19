import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceController } from './performance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogModule } from '../system-log/system-log.module';

@Module({
  imports: [PrismaModule, SystemLogModule],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
