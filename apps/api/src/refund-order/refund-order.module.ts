import { Module } from '@nestjs/common';
import { RefundOrderController } from './refund-order.controller';
import { RefundOrderService } from './refund-order.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TimelineModule } from '../timeline/timeline.module';
import { ResponsibilityRuleModule } from '../responsibility-rule/responsibility-rule.module';

@Module({
  imports: [PrismaModule, TimelineModule, ResponsibilityRuleModule],
  controllers: [RefundOrderController],
  providers: [RefundOrderService],
  exports: [RefundOrderService],
})
export class RefundOrderModule {}
