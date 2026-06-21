import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { TimelineModule } from '../timeline/timeline.module';
import { ConflictCheckModule } from '../conflict-check/conflict-check.module';

@Module({
  imports: [TimelineModule, ConflictCheckModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
