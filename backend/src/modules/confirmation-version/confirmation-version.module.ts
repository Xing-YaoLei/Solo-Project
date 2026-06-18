import { Module } from '@nestjs/common';
import { ConfirmationVersionService } from './confirmation-version.service';
import { ConfirmationVersionController } from './confirmation-version.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConfirmationVersionController],
  providers: [ConfirmationVersionService],
  exports: [ConfirmationVersionService],
})
export class ConfirmationVersionModule {}
