import { Module } from '@nestjs/common';
import { QualityChecksService } from './quality-checks.service';
import { QualityChecksController } from './quality-checks.controller';

@Module({
  controllers: [QualityChecksController],
  providers: [QualityChecksService],
  exports: [QualityChecksService],
})
export class QualityChecksModule {}
