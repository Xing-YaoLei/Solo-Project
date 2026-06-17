import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StatisticsQueryDto, TimeRange } from './dto/statistics-query.dto';
import { ChangeOrderStatus, MaterialDelayStatus, AfterSalesStatus } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private getCacheKey(prefix: string, query: StatisticsQueryDto): string {
    const queryStr = JSON.stringify(query);
    return `stats:${prefix}:${Buffer.from(queryStr).toString('base64')}`;
  }

  private async getCachedData(key: string): Promise<any | null> {
    const cached = await this.redisService.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  private async setCachedData(key: string, data: any, ttl: number = 300): Promise<void> {
    await this.redisService.set(key, JSON.stringify(data), ttl);
  }

  private getDateRange(timeRange?: TimeRange, startDate?: string, endDate?: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = endDate ? new Date(endDate) : now;

    if (startDate) {
      start = new Date(startDate);
    } else if (timeRange) {
      switch (timeRange) {
        case TimeRange.DAY:
          start = new Date(now);
          start.setDate(start.getDate() - 1);
          break;
        case TimeRange.WEEK:
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          break;
        case TimeRange.MONTH:
          start = new Date(now);
          start.setMonth(start.getMonth() - 1);
          break;
        case TimeRange.QUARTER:
          start = new Date(now);
          start.setMonth(start.getMonth() - 3);
          break;
        case TimeRange.YEAR:
          start = new Date(now);
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start = new Date(0);
      }
    } else {
      start = new Date(0);
    }

    return { start, end };
  }

  async getProjectStatistics(query: StatisticsQueryDto) {
    const cacheKey = this.getCacheKey('project', query);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const { projectId, startDate, endDate, timeRange } = query;
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const [totalChanges, completedChanges, delayedOrders, materialDelays, afterSales] = await Promise.all([
      this.prisma.designChangeOrder.count({ where }),
      this.prisma.designChangeOrder.count({
        where: {
          ...where,
          status: ChangeOrderStatus.ACCEPTED,
        },
      }),
      this.prisma.designChangeOrder.findMany({
        where: {
          ...where,
          deadline: { not: null },
          status: { not: ChangeOrderStatus.ACCEPTED },
        },
        select: {
          id: true,
          deadline: true,
          completedAt: true,
          impactOnSchedule: true,
        },
      }),
      this.prisma.materialDelay.count({
        where: {
          createdAt: { gte: start, lte: end },
          ...(projectId ? { projectId } : {}),
        },
      }),
      this.prisma.afterSalesTicket.count({
        where: {
          createdAt: { gte: start, lte: end },
          ...(projectId ? { projectId } : {}),
        },
      }),
    ]);

    let totalDelayedDays = 0;
    let delayedCount = 0;
    const now = new Date();

    for (const order of delayedOrders) {
      if (order.deadline) {
        const deadline = new Date(order.deadline);
        const compareDate = order.completedAt ? new Date(order.completedAt) : now;
        const diffDays = Math.ceil((compareDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          totalDelayedDays += diffDays;
          delayedCount++;
        }
      }
      if (order.impactOnSchedule && order.impactOnSchedule > 0) {
        totalDelayedDays += order.impactOnSchedule;
      }
    }

    const costIncreaseResult = await this.prisma.designChangeOrder.aggregate({
      where: {
        ...where,
        impactOnCost: { not: null },
      },
      _sum: {
        impactOnCost: true,
      },
    });

    const result = {
      totalChanges,
      completedChanges,
      pendingChanges: totalChanges - completedChanges,
      completionRate: totalChanges > 0 ? Number(((completedChanges / totalChanges) * 100).toFixed(2)) : 0,
      delayedCount,
      totalDelayedDays,
      avgDelayDays: delayedCount > 0 ? Number((totalDelayedDays / delayedCount).toFixed(2)) : 0,
      costIncrease: costIncreaseResult._sum.impactOnCost ? Number(costIncreaseResult._sum.impactOnCost) : 0,
      materialDelays,
      afterSales,
    };

    await this.setCachedData(cacheKey, result, 300);
    return result;
  }

  async getScheduleDeviation(query: StatisticsQueryDto) {
    const cacheKey = this.getCacheKey('schedule', query);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const { projectId, startDate, endDate, timeRange } = query;
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
      deadline: { not: null },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const orders = await this.prisma.designChangeOrder.findMany({
      where,
      select: {
        id: true,
        orderNo: true,
        title: true,
        deadline: true,
        completedAt: true,
        status: true,
        impactOnSchedule: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    const now = new Date();
    const onTime = [];
    const delayed = [];
    const pending = [];

    for (const order of orders) {
      if (order.status === ChangeOrderStatus.ACCEPTED && order.completedAt) {
        const completed = new Date(order.completedAt);
        const deadline = new Date(order.deadline!);
        if (completed <= deadline) {
          onTime.push(order);
        } else {
          delayed.push(order);
        }
      } else if (order.status !== ChangeOrderStatus.CANCELLED) {
        const deadline = new Date(order.deadline!);
        if (deadline < now) {
          delayed.push(order);
        } else {
          pending.push(order);
        }
      }
    }

    const result = {
      total: orders.length,
      onTimeCount: onTime.length,
      delayedCount: delayed.length,
      pendingCount: pending.length,
      onTimeRate: orders.length > 0 ? Number(((onTime.length / orders.length) * 100).toFixed(2)) : 0,
      delayedRate: orders.length > 0 ? Number(((delayed.length / orders.length) * 100).toFixed(2)) : 0,
      onTimeList: onTime,
      delayedList: delayed,
      pendingList: pending,
    };

    await this.setCachedData(cacheKey, result, 300);
    return result;
  }

  async getMaterialDelayStatistics(query: StatisticsQueryDto) {
    const cacheKey = this.getCacheKey('material', query);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const { projectId, startDate, endDate, timeRange } = query;
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const [total, resolved, unresolved, delaysWithDays] = await Promise.all([
      this.prisma.materialDelay.count({ where }),
      this.prisma.materialDelay.count({
        where: {
          ...where,
          status: { in: [MaterialDelayStatus.RESOLVED, MaterialDelayStatus.CLOSED] },
        },
      }),
      this.prisma.materialDelay.count({
        where: {
          ...where,
          status: { notIn: [MaterialDelayStatus.RESOLVED, MaterialDelayStatus.CLOSED] },
        },
      }),
      this.prisma.materialDelay.findMany({
        where: {
          ...where,
          delayDays: { not: null },
        },
        select: {
          id: true,
          materialName: true,
          delayDays: true,
          status: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { delayDays: 'desc' },
      }),
    ]);

    const totalDelayDays = delaysWithDays.reduce((sum, d) => sum + (d.delayDays || 0), 0);

    const result = {
      total,
      resolved,
      unresolved,
      resolutionRate: total > 0 ? Number(((resolved / total) * 100).toFixed(2)) : 0,
      totalDelayDays,
      avgDelayDays: total > 0 ? Number((totalDelayDays / total).toFixed(2)) : 0,
      topDelays: delaysWithDays.slice(0, 10),
    };

    await this.setCachedData(cacheKey, result, 300);
    return result;
  }

  async getAfterSalesStatistics(query: StatisticsQueryDto) {
    const cacheKey = this.getCacheKey('aftersales', query);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const { projectId, startDate, endDate, timeRange } = query;
    const { start, end } = this.getDateRange(timeRange, startDate, endDate);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.afterSalesTicket.count({ where }),
      this.prisma.afterSalesTicket.count({ where: { ...where, status: AfterSalesStatus.OPEN } }),
      this.prisma.afterSalesTicket.count({ where: { ...where, status: AfterSalesStatus.IN_PROGRESS } }),
      this.prisma.afterSalesTicket.count({ where: { ...where, status: AfterSalesStatus.RESOLVED } }),
      this.prisma.afterSalesTicket.count({ where: { ...where, status: AfterSalesStatus.CLOSED } }),
    ]);

    const tickets = await this.prisma.afterSalesTicket.findMany({
      where,
      select: {
        id: true,
        ticketNo: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        project: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const result = {
      total,
      open,
      inProgress,
      resolved,
      closed,
      resolutionRate: total > 0 ? Number((((resolved + closed) / total) * 100).toFixed(2)) : 0,
      recentTickets: tickets,
    };

    await this.setCachedData(cacheKey, result, 300);
    return result;
  }

  async getOverview(query: StatisticsQueryDto) {
    const cacheKey = this.getCacheKey('overview', query);
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const [projectStats, scheduleStats, materialStats, afterSalesStats] = await Promise.all([
      this.getProjectStatistics(query),
      this.getScheduleDeviation(query),
      this.getMaterialDelayStatistics(query),
      this.getAfterSalesStatistics(query),
    ]);

    const result = {
      project: projectStats,
      schedule: scheduleStats,
      material: materialStats,
      afterSales: afterSalesStats,
    };

    await this.setCachedData(cacheKey, result, 300);
    return result;
  }
}
