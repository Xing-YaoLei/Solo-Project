import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { ReminderProcessor } from './reminder.processor';
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
  controllers: [ReminderController],
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}
