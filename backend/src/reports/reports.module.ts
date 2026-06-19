import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, RedisService],
  exports: [ReportsService],
})
export class ReportsModule {}
