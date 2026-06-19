import { Module } from '@nestjs/common';
import { ConflictsService } from './conflicts.service';
import { ConflictsController } from './conflicts.controller';

@Module({
  controllers: [ConflictsController],
  providers: [ConflictsService],
  exports: [ConflictsService],
})
export class ConflictsModule {}
