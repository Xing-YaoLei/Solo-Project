import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { PartsModule } from './parts/parts.module';
import { PartRequestsModule } from './part-requests/part-requests.module';
import { QualityChecksModule } from './quality-checks/quality-checks.module';
import { MaintenanceRemindersModule } from './maintenance-reminders/maintenance-reminders.module';
import { StatisticsModule } from './statistics/statistics.module';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    RolesModule,
    VehiclesModule,
    WorkOrdersModule,
    PartsModule,
    PartRequestsModule,
    QualityChecksModule,
    MaintenanceRemindersModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
