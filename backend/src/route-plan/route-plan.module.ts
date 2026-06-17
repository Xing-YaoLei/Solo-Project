import { Module } from '@nestjs/common';
import { RoutePlanController } from './route-plan.controller';
import { RoutePlanService } from './route-plan.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoutePlanController],
  providers: [RoutePlanService],
  exports: [RoutePlanService],
})
export class RoutePlanModule {}
