import { Module } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import { DisputeController } from './dispute.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SystemLogModule } from '../system-log/system-log.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, SystemLogModule, NotificationModule],
  controllers: [DisputeController],
  providers: [DisputeService],
  exports: [DisputeService],
})
export class DisputeModule {}
