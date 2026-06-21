import { Module } from '@nestjs/common';
import { RescheduleService } from './reschedule.service';
import { RescheduleController } from './reschedule.controller';

@Module({
  controllers: [RescheduleController],
  providers: [RescheduleService],
  exports: [RescheduleService],
})
export class RescheduleModule {}
