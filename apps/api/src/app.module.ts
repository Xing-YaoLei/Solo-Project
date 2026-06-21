import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RiderModule } from './rider/rider.module';
import { TaskModule } from './task/task.module';
import { DamageModule } from './damage/damage.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, UserModule, RiderModule, TaskModule, DamageModule, DashboardModule],
})
export class AppModule {}
