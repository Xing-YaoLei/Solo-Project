import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TodoPoolController } from './todo-pool.controller';
import { TodoPoolService } from './todo-pool.service';
import { OverdueProcessor } from './overdue.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'overdue',
    }),
  ],
  controllers: [TodoPoolController],
  providers: [TodoPoolService, OverdueProcessor],
  exports: [TodoPoolService],
})
export class TodoPoolModule {}
