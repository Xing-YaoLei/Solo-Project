import { Module } from '@nestjs/common';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DepositsController],
  providers: [DepositsService, PrismaService],
  exports: [DepositsService],
})
export class DepositsModule {}
