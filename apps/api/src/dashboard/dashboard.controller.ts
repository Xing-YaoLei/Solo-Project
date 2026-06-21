import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TaskStatus } from '@prisma/client';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get('overview')
  async getOverview() {
    const cacheKey = 'dashboard:overview';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    const [taskStats, riderStats, damageStats] = await Promise.all([
      {
        total: await this.prisma.verificationTask.count(),
        today: await this.prisma.verificationTask.count({
          where: { createdAt: { gte: today } },
        }),
        byStatus: await this.prisma.verificationTask.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      },
      {
        total: await this.prisma.riderProfile.count(),
        online: await this.prisma.riderProfile.count({
          where: { status: { not: 'OFFLINE' } },
        }),
        onDelivery: await this.prisma.riderProfile.count({
          where: { status: 'ON_DELIVERY' },
        }),
      },
      {
        total: await this.prisma.damageReport.count(),
        pending: await this.prisma.damageReport.count({
          where: {
            status: { in: ['REPORTED', 'UNDER_REVIEW', 'COMMUNICATING'] },
          },
        }),
      },
    ]);

    const result = { taskStats, riderStats, damageStats, updatedAt: new Date() };
    await this.redis.set(cacheKey, JSON.stringify(result), 120);
    return result;
  }

  @Get('rider-trend')
  async getRiderTrend(
    @Query('days') days = 30,
    @Query('riderId') riderId?: string,
  ) {
    const cacheKey = `dashboard:rider-trend:${days}:${riderId || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 86400000);
    startDate.setHours(0, 0, 0, 0);

    const where: any = {
      date: { gte: startDate },
    };
    if (riderId) where.riderId = riderId;

    const activities = await this.prisma.riderActivity.findMany({
      where,
      include: {
        rider: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: [{ date: 'asc' }, { riderId: 'asc' }],
    });

    const byDate: Record<string, any> = {};
    const byRider: Record<string, { name: string; data: any[] }> = {};

    activities.forEach((act) => {
      const dateStr = act.date.toISOString().split('T')[0];

      if (!byDate[dateStr]) {
        byDate[dateStr] = { date: dateStr, totalOrders: 0, totalLogin: 0, avgDuration: 0, riders: 0 };
      }
      byDate[dateStr].totalOrders += act.orderCount;
      byDate[dateStr].totalLogin += act.loginCount;
      byDate[dateStr].avgDuration += act.workDuration;
      byDate[dateStr].riders += 1;

      const riderName = (act.rider as any).user?.name || act.riderId;
      if (!byRider[act.riderId]) {
        byRider[act.riderId] = { name: riderName, data: [] };
      }
      byRider[act.riderId].data.push({
        date: dateStr,
        orders: act.orderCount,
        loginCount: act.loginCount,
        workDuration: act.workDuration,
        distance: act.distance,
      });
    });

    Object.values(byDate).forEach((d) => {
      d.avgDuration = d.riders > 0 ? Math.round(d.avgDuration / d.riders) : 0;
    });

    const result = {
      days,
      trendData: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
      riderSeries: Object.values(byRider),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  @Get('task-distribution')
  async getTaskDistribution() {
    const cacheKey = 'dashboard:task-distribution';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const statusLabels: Record<string, string> = {
      [TaskStatus.PENDING]: '待分派',
      [TaskStatus.ASSIGNED]: '已分派',
      [TaskStatus.IN_PROGRESS]: '处理中',
      [TaskStatus.VERIFIED]: '已核验',
      [TaskStatus.COMPLETED]: '已完成',
      [TaskStatus.CANCELLED]: '已取消',
      [TaskStatus.DAMAGED]: '物品损坏',
    };

    const groupBy = await this.prisma.verificationTask.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const result = groupBy.map((item) => ({
      status: item.status,
      label: statusLabels[item.status] || item.status,
      value: item._count.status,
    }));

    await this.redis.set(cacheKey, JSON.stringify(result), 180);
    return result;
  }
}
