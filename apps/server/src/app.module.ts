import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { ChangeOrdersModule } from './change-orders/change-orders.module';
import { MaterialDelaysModule } from './material-delays/material-delays.module';
import { AcceptancePhotosModule } from './acceptance-photos/acceptance-photos.module';
import { WorkerCheckinsModule } from './worker-checkins/worker-checkins.module';
import { AfterSalesModule } from './after-sales/after-sales.module';
import { BatchOperationsModule } from './batch-operations/batch-operations.module';
import { StatisticsModule } from './statistics/statistics.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ChangeOrdersModule,
    MaterialDelaysModule,
    AcceptancePhotosModule,
    WorkerCheckinsModule,
    AfterSalesModule,
    BatchOperationsModule,
    StatisticsModule,
    OperationLogsModule,
  ],
})
export class AppModule {}
