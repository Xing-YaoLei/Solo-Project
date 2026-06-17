import { Module } from '@nestjs/common';
import { FollowUpTasksController } from './follow-up-tasks.controller';
import { FollowUpTasksService } from './follow-up-tasks.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FollowUpTasksController],
  providers: [FollowUpTasksService],
  exports: [FollowUpTasksService],
})
export class FollowUpTasksModule {}
