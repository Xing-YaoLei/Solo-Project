import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { PropertiesModule } from './properties/properties.module';
import { CleaningTasksModule } from './cleaning-tasks/cleaning-tasks.module';
import { DepositsModule } from './deposits/deposits.module';
import { CheckinDocumentsModule } from './checkin-documents/checkin-documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { ReportsModule } from './reports/reports.module';
import { MissedOrdersModule } from './missed-orders/missed-orders.module';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    PropertiesModule,
    CleaningTasksModule,
    DepositsModule,
    CheckinDocumentsModule,
    NotificationsModule,
    SystemLogsModule,
    ReportsModule,
    MissedOrdersModule,
    UsersModule,
    RecordsModule,
  ],
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService],
})
export class AppModule {}
