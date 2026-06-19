import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { CalendarModule } from './calendar/calendar.module';
import { OrdersModule } from './orders/orders.module';
import { CleaningModule } from './cleaning/cleaning.module';
import { DocumentsModule } from './documents/documents.module';
import { DepositsModule } from './deposits/deposits.module';
import { ConflictsModule } from './conflicts/conflicts.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    CalendarModule,
    OrdersModule,
    CleaningModule,
    DocumentsModule,
    DepositsModule,
    ConflictsModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
