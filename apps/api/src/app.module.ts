import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE, APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { EvidencesModule } from './evidences/evidences.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { SamplingsModule } from './samplings/samplings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { IssuesModule } from './issues/issues.module';
import { StatisticsModule } from './statistics/statistics.module';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { UnauthorizedExceptionFilter } from './common/filters/unauthorized-exception.filter';
import { RolesGuard } from './auth/roles.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    TasksModule,
    EvidencesModule,
    ReviewsModule,
    ChecklistsModule,
    SamplingsModule,
    NotificationsModule,
    AuditLogModule,
    IssuesModule,
    StatisticsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      provide: APP_FILTER,
      useClass: UnauthorizedExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
})
export class AppModule {}
