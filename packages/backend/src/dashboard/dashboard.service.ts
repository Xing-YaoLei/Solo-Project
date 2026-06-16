import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CACHE_TTL = 300;

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [total, completed, pending, inProgress, escalated] = await Promise.all([
      this.prisma.followUpTask.count(),
      this.prisma.followUpTask.count({ where: { status: 'COMPLETED' } }),
      this.prisma.followUpTask.count({ where: { status: 'PENDING' } }),
      this.prisma.followUpTask.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.followUpTask.count({ where: { status: 'ESCALATED' } }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const trendData = await this.getTrendData(30);

    const stats = {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      escalatedTasks: escalated,
      completionRate,
      trendData,
    };

    await this.redisService.set(cacheKey, JSON.stringify(stats), CACHE_TTL);

    return stats;
  }

  async getTrend(days: number) {
    const cacheKey = `dashboard:trend:${days}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const trendData = await this.getTrendData(days);
    await this.redisService.set(cacheKey, JSON.stringify(trendData), CACHE_TTL);

    return trendData;
  }

  private async getTrendData(days: number) {
    const trendData: { date: string; created: number; completed: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [created, completed] = await Promise.all([
        this.prisma.followUpTask.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        this.prisma.followUpTask.count({
          where: {
            completedAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      trendData.push({
        date: date.toISOString().split('T')[0],
        created,
        completed,
      });
    }

    return trendData;
  }
}
