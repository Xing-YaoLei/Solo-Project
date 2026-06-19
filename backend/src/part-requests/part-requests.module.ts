import { Module } from '@nestjs/common';
import { PartRequestsService } from './part-requests.service';
import { PartRequestsController } from './part-requests.controller';

@Module({
  controllers: [PartRequestsController],
  providers: [PartRequestsService],
  exports: [PartRequestsService],
})
export class PartRequestsModule {}
