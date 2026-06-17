import { Module } from '@nestjs/common';
import { RepairOrderController } from './repair-order.controller';
import { RepairOrderService } from './repair-order.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RepairOrderController],
  providers: [RepairOrderService],
  exports: [RepairOrderService],
})
export class RepairOrderModule {}
