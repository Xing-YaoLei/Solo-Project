import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfirmationTaskService } from './confirmation-task.service';
import { ConfirmationTaskController } from './confirmation-task.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BULL_QUEUES } from '../../common/bull/queue.constants';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BullModule.registerQueue({
      name: BULL_QUEUES.REMINDER,
    }),
  ],
  controllers: [ConfirmationTaskController],
  providers: [ConfirmationTaskService],
  exports: [ConfirmationTaskService],
})
export class ConfirmationTaskModule {}
