import { Module } from '@nestjs/common';
import { BatchOperationsService } from './batch-operations.service';
import { BatchOperationsController } from './batch-operations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [BatchOperationsController],
  providers: [BatchOperationsService],
  exports: [BatchOperationsService],
})
export class BatchOperationsModule {}
