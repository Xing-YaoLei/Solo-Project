import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { MaterialsModule } from './materials/materials.module';
import { ConflictCheckModule } from './conflict-check/conflict-check.module';
import { TimelineModule } from './timeline/timeline.module';
import { ReportsModule } from './reports/reports.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    CasesModule,
    MaterialsModule,
    ConflictCheckModule,
    TimelineModule,
    ReportsModule,
    InvoicesModule,
  ],
})
export class AppModule {}
