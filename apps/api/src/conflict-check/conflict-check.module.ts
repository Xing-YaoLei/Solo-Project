import { Module } from '@nestjs/common';
import { ConflictCheckController } from './conflict-check.controller';
import { ConflictCheckService } from './conflict-check.service';
import { TimelineModule } from '../timeline/timeline.module';

@Module({
  imports: [TimelineModule],
  controllers: [ConflictCheckController],
  providers: [ConflictCheckService],
  exports: [ConflictCheckService],
})
export class ConflictCheckModule {}
