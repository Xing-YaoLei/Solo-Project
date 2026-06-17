import { Module } from '@nestjs/common';
import { WorkerCheckinsService } from './worker-checkins.service';
import { WorkerCheckinsController } from './worker-checkins.controller';

@Module({
  controllers: [WorkerCheckinsController],
  providers: [WorkerCheckinsService],
  exports: [WorkerCheckinsService],
})
export class WorkerCheckinsModule {}
