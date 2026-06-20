import { Module } from '@nestjs/common';
import { DisputeController, NotificationController } from './dispute.controller';
import { DisputeService } from './dispute.service';

@Module({
  controllers: [DisputeController, NotificationController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
