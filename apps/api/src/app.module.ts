import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { PropertiesModule } from './properties/properties.module'
import { TenantsModule } from './tenants/tenants.module'
import { ContractsModule } from './contracts/contracts.module'
import { MaintenanceModule } from './maintenance/maintenance.module'
import { UtilitiesModule } from './utilities/utilities.module'
import { TasksModule } from './tasks/tasks.module'
import { FinanceModule } from './finance/finance.module'
import { ReportsModule } from './reports/reports.module'
import { RedisModule } from './redis/redis.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    TenantsModule,
    ContractsModule,
    MaintenanceModule,
    UtilitiesModule,
    TasksModule,
    FinanceModule,
    ReportsModule,
  ],
})
export class AppModule {}
