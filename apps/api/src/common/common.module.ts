import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { StatusHistoryService } from './status-history/status-history.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, StatusHistoryService],
  exports: [PrismaService, RedisService, StatusHistoryService],
})
export class CommonModule {}
