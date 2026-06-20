import { Module } from '@nestjs/common';
import { RefundRuleController } from './refund-rule.controller';
import { RefundRuleService } from './refund-rule.service';

@Module({
  controllers: [RefundRuleController],
  providers: [RefundRuleService],
  exports: [RefundRuleService],
})
export class RefundRuleModule {}
