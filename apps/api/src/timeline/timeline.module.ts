import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
