import { Module } from '@nestjs/common';
import { ResponsibilityRuleController } from './responsibility-rule.controller';
import { ResponsibilityRuleService } from './responsibility-rule.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ResponsibilityRuleController],
  providers: [ResponsibilityRuleService],
  exports: [ResponsibilityRuleService],
})
export class ResponsibilityRuleModule {}
