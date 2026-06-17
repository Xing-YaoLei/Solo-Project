import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  @Cron('0 * * * *')
  async markMissedReminders() {
    const now = new Date();
    const result = await this.prisma.medicationReminder.updateMany({
      where: {
        status: 'PENDING',
        scheduledTime: { lt: now },
      },
      data: { status: 'MISSED' },
    });
    this.logger.log(`Marked ${result.count} reminders as MISSED`);
  }

  @Cron('0 */6 * * *')
  async cacheElderStatistics() {
    const totalElders = await this.prisma.elder.count();
    const activeElders = await this.prisma.elder.count({ where: { status: 'ACTIVE' } });
    const highRiskElders = await this.prisma.elder.count({ where: { fallRiskLevel: 'HIGH', status: 'ACTIVE' } });
    const pendingReminders = await this.prisma.medicationReminder.count({ where: { status: 'PENDING' } });

    const stats = JSON.stringify({ totalElders, activeElders, highRiskElders, pendingReminders, updatedAt: new Date().toISOString() });
    await this.redisService.set('elder:statistics', stats);
    await this.redisService.expire('elder:statistics', 21600);
    this.logger.log('Cached elder statistics to Redis');
  }
}
