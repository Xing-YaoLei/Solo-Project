import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisCacheModule } from './common/redis/redis-cache.module';
import { BullQueueModule } from './common/bull/bull-queue.module';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProjectModule } from './modules/project/project.module';
import { ConfirmationTaskModule } from './modules/confirmation-task/confirmation-task.module';
import { ConfirmationVersionModule } from './modules/confirmation-version/confirmation-version.module';
import { ChatModule } from './modules/chat/chat.module';
import { DisputeModule } from './modules/dispute/dispute.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisCacheModule,
    BullQueueModule,
    AuthModule,
    UserModule,
    ProjectModule,
    ConfirmationTaskModule,
    ConfirmationVersionModule,
    ChatModule,
    DisputeModule,
    ReminderModule,
    ReportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
