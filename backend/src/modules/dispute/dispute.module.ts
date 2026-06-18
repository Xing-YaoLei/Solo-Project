import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
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
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
