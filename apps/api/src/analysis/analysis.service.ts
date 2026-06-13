import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RefundStatus, ResponsibilityParty } from '@prisma/client';
import type { CloseDurationAnalysis } from '@solo/shared';

const CACHE_KEY = 'analysis:close-duration';
const CACHE_TTL = 300;

interface AnalysisParams {
  startDate?: Date;
  endDate?: Date;
  region?: string;
  assigneeId?: string;
  responsibility?: ResponsibilityParty;
  problemTag?: string;
}

@Injectable()
export class AnalysisService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getCloseDurationAnalysis(params: AnalysisParams = {}): Promise<CloseDurationAnalysis> {
    const cacheKey = `${CACHE_KEY}:${JSON.stringify(params)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      status: RefundStatus.CLOSED,
      handlingDurationMinutes: { not: null },
    };

    if (params.startDate) where.actualClosedAt = { ...where.actualClosedAt, gte: params.startDate };
    if (params.endDate) where.actualClosedAt = { ...where.actualClosedAt, lte: params.endDate };
    if (params.region) where.region = params.region;
    if (params.assigneeId) where.assigneeId = params.assigneeId;
    if (params.responsibility) where.responsibility = params.responsibility;
    if (params.problemTag) where.problemTags = { has: params.problemTag };

    const closedOrders = await this.prisma.refundOrder.findMany({
      where,
      select: {
        handlingDurationMinutes: true,
        region: true,
        responsibility: true,
        actualClosedAt: true,
        orderNo: true,
      },
      orderBy: { actualClosedAt: 'desc' },
    });

    if (closedOrders.length === 0) {
      const emptyResult: CloseDurationAnalysis = {
        avgDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        distribution: [],
        byRegion: [],
        byResponsibility: [],
      };
      await this.redis.set(cacheKey, JSON.stringify(emptyResult), CACHE_TTL);
      return emptyResult;
    }

    const durations = closedOrders
      .map((o) => o.handlingDurationMinutes!)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);

    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const medianDuration = durations.length > 0
      ? durations[Math.floor(durations.length / 2)]
      : 0;

    const p95Duration = durations.length > 0
      ? durations[Math.floor(durations.length * 0.95)]
      : 0;

    const distribution = this.calculateDistribution(durations);
    const byRegion = this.aggregateByRegion(closedOrders);
    const byResponsibility = this.aggregateByResponsibility(closedOrders);

    const result: CloseDurationAnalysis = {
      avgDuration,
      medianDuration,
      p95Duration,
      distribution,
      byRegion,
      byResponsibility,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), CACHE_TTL);

    return result;
  }

  private calculateDistribution(durations: number[]) {
    const ranges = [
      { min: 0, max: 24 * 60, label: '0-24小时' },
      { min: 24 * 60, max: 48 * 60, label: '24-48小时' },
      { min: 48 * 60, max: 72 * 60, label: '48-72小时' },
      { min: 72 * 60, max: 7 * 24 * 60, label: '3-7天' },
      { min: 7 * 24 * 60, max: 14 * 24 * 60, label: '7-14天' },
      { min: 14 * 24 * 60, max: Infinity, label: '>14天' },
    ];

    return ranges.map((range) => ({
      range: range.label,
      count: durations.filter((d) => d >= range.min && d < range.max).length,
    }));
  }

  private aggregateByRegion(orders: any[]) {
    const regionMap = new Map<string, { total: number; count: number }>();

    for (const order of orders) {
      if (!order.region || !order.handlingDurationMinutes) continue;
      
      const existing = regionMap.get(order.region) || { total: 0, count: 0 };
      regionMap.set(order.region, {
        total: existing.total + order.handlingDurationMinutes,
        count: existing.count + 1,
      });
    }

    return Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      avgDuration: Math.round(data.total / data.count),
      count: data.count,
    })).sort((a, b) => b.count - a.count);
  }

  private aggregateByResponsibility(orders: any[]) {
    const respMap = new Map<string, { total: number; count: number }>();

    for (const order of orders) {
      if (!order.responsibility || !order.handlingDurationMinutes) continue;
      
      const existing = respMap.get(order.responsibility) || { total: 0, count: 0 };
      respMap.set(order.responsibility, {
        total: existing.total + order.handlingDurationMinutes,
        count: existing.count + 1,
      });
    }

    const responsibilityLabels: Record<string, string> = {
      PLATFORM: '平台',
      MERCHANT: '商家',
      LOGISTICS: '物流',
      CUSTOMER: '客户',
      SUPPLIER: '供应商',
      OTHER: '其他',
    };

    return Array.from(respMap.entries()).map(([responsibility, data]) => ({
      responsibility: responsibilityLabels[responsibility] || responsibility,
      avgDuration: Math.round(data.total / data.count),
      count: data.count,
    })).sort((a, b) => b.count - a.count);
  }

  async getTrendAnalysis(params: AnalysisParams & { days?: number } = {}) {
    const { days = 30, ...filterParams } = params;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      status: RefundStatus.CLOSED,
      actualClosedAt: { gte: startDate, lte: endDate },
    };

    if (filterParams.region) where.region = filterParams.region;
    if (filterParams.responsibility) where.responsibility = filterParams.responsibility;

    const orders = await this.prisma.refundOrder.findMany({
      where,
      select: {
        actualClosedAt: true,
        handlingDurationMinutes: true,
        refundAmount: true,
        status: true,
      },
      orderBy: { actualClosedAt: 'asc' },
    });

    const dailyData = new Map<string, { count: number; totalDuration: number; totalAmount: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, { count: 0, totalDuration: 0, totalAmount: 0 });
    }

    for (const order of orders) {
      const dateStr = order.actualClosedAt!.toISOString().split('T')[0];
      const existing = dailyData.get(dateStr) || { count: 0, totalDuration: 0, totalAmount: 0 };
      dailyData.set(dateStr, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (order.handlingDurationMinutes || 0),
        totalAmount: existing.totalAmount + Number(order.refundAmount || 0),
      });
    }

    const trend = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
    }));

    return { days, startDate, endDate, trend };
  }

  async getProblemTagAnalysis(params: AnalysisParams = {}) {
    const where: any = {
      status: RefundStatus.CLOSED,
    };

    if (params.startDate) where.createdAt = { ...where.createdAt, gte: params.startDate };
    if (params.endDate) where.createdAt = { ...where.createdAt, lte: params.endDate };
    if (params.region) where.region = params.region;

    const orders = await this.prisma.refundOrder.findMany({
      where,
      select: {
        problemTags: true,
        handlingDurationMinutes: true,
        refundAmount: true,
      },
    });

    const tagMap = new Map<string, { count: number; totalDuration: number; totalAmount: number }>();

    for (const order of orders) {
      for (const tag of order.problemTags) {
        const existing = tagMap.get(tag) || { count: 0, totalDuration: 0, totalAmount: 0 };
        tagMap.set(tag, {
          count: existing.count + 1,
          totalDuration: existing.totalDuration + (order.handlingDurationMinutes || 0),
          totalAmount: existing.totalAmount + Number(order.refundAmount || 0),
        });
      }
    }

    return Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getPerformanceByAssignee(params: AnalysisParams & { days?: number } = {}) {
    const { days = 30, ...filterParams } = params;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = {
      status: RefundStatus.CLOSED,
      actualClosedAt: { gte: startDate },
      assigneeId: { not: null },
    };

    if (filterParams.region) where.region = filterParams.region;

    const assigneeMap = new Map<string, {
      id: string;
      name: string;
      count: number;
      totalDuration: number;
      totalAmount: number;
      onTimeCount: number;
    }>();

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
    });

    for (const user of users) {
      assigneeMap.set(user.id, {
        id: user.id,
        name: user.name,
        count: 0,
        totalDuration: 0,
        totalAmount: 0,
        onTimeCount: 0,
      });
    }

    const orders = await this.prisma.refundOrder.findMany({
      where,
      select: {
        assigneeId: true,
        deadline: true,
        actualClosedAt: true,
        handlingDurationMinutes: true,
        refundAmount: true,
      },
    });

    for (const order of orders) {
      if (!order.assigneeId) continue;
      
      const existing = assigneeMap.get(order.assigneeId);
      if (!existing) continue;

      const onTime = order.actualClosedAt! <= order.deadline;

      assigneeMap.set(order.assigneeId, {
        ...existing,
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (order.handlingDurationMinutes || 0),
        totalAmount: existing.totalAmount + Number(order.refundAmount || 0),
        onTimeCount: existing.onTimeCount + (onTime ? 1 : 0),
      });
    }

    return Array.from(assigneeMap.values())
      .filter((a) => a.count > 0)
      .map((data) => ({
        ...data,
        avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
        onTimeRate: data.count > 0 ? Math.round((data.onTimeCount / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayStats, weekStats, monthStats, statusStats] = await Promise.all([
      this.prisma.refundOrder.aggregate({
        _count: true,
        _sum: { refundAmount: true },
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.refundOrder.aggregate({
        _count: true,
        _sum: { refundAmount: true },
        where: { createdAt: { gte: weekAgo } },
      }),
      this.prisma.refundOrder.aggregate({
        _count: true,
        _sum: { refundAmount: true },
        where: { createdAt: { gte: monthAgo } },
      }),
      this.prisma.refundOrder.groupBy({
        by: ['status'],
        _count: true,
        where: { status: { not: RefundStatus.CLOSED } },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of statusStats) {
      statusCounts[s.status] = s._count;
    }

    return {
      today: {
        count: todayStats._count,
        amount: Number(todayStats._sum.refundAmount || 0),
      },
      week: {
        count: weekStats._count,
        amount: Number(weekStats._sum.refundAmount || 0),
      },
      month: {
        count: monthStats._count,
        amount: Number(monthStats._sum.refundAmount || 0),
      },
      statusCounts,
    };
  }

  async clearCache() {
    const keys = await this.redis.getClient().keys(`${CACHE_KEY}:*`);
    if (keys.length > 0) {
      await this.redis.getClient().del(...keys);
    }
    return { cleared: keys.length };
  }
}
