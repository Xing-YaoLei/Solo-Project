import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HearingModule } from './modules/hearing/hearing.module';
import { ConflictModule } from './modules/conflict/conflict.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { ExceptionModule } from './modules/exception/exception.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CommonModule,
    HearingModule,
    ConflictModule,
    AttendanceModule,
    TimelineModule,
    ReminderModule,
    ExceptionModule,
  ],
})
export class AppModule {}
