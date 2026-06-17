import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { OrderSource, OrderStatus, ReviewTag, DelayReason } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getOverview(startDate?: string, endDate?: string) {
    const cacheKey = `stats:overview:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};
    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };

    const [
      totalOrders,
      completedOrders,
      onTimeOrders,
      delayedOrders,
      pendingCount,
      inProgressCount,
    ] = await Promise.all([
      this.prisma.repairOrder.count({ where }),
      this.prisma.repairOrder.count({
        where: { ...where, status: OrderStatus.CLOSED },
      }),
      this.prisma.repairOrder.count({
        where: { ...where, status: OrderStatus.CLOSED, isOnTime: true },
      }),
      this.prisma.repairOrder.count({
        where: { ...where, delayRecords: { some: {} } },
      }),
      this.prisma.repairOrder.count({
        where: { ...where, status: { in: [OrderStatus.CREATED, OrderStatus.ASSIGNED] } },
      }),
      this.prisma.repairOrder.count({
        where: { ...where, status: OrderStatus.IN_PROGRESS },
      }),
    ]);

    const onTimeRate = completedOrders > 0 ? Math.round((onTimeOrders / completedOrders) * 100) : 0;
    const delayRate = totalOrders > 0 ? Math.round((delayedOrders / totalOrders) * 100) : 0;

    const result = {
      totalOrders,
      completedOrders,
      onTimeOrders,
      delayedOrders,
      pendingCount,
      inProgressCount,
      onTimeRate,
      delayRate,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  async getBySource(startDate?: string, endDate?: string) {
    const cacheKey = `stats:source:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};
    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };

    const sources = Object.values(OrderSource);
    const results = [];

    for (const source of sources) {
      const count = await this.prisma.repairOrder.count({
        where: { ...where, source },
      });
      const closed = await this.prisma.repairOrder.count({
        where: { ...where, source, status: OrderStatus.CLOSED },
      });
      const onTime = await this.prisma.repairOrder.count({
        where: { ...where, source, status: OrderStatus.CLOSED, isOnTime: true },
      });

      results.push({
        source,
        count,
        closed,
        onTime,
        onTimeRate: closed > 0 ? Math.round((onTime / closed) * 100) : 0,
      });
    }

    await this.redis.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }

  async getByPerson(startDate?: string, endDate?: string) {
    const cacheKey = `stats:person:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      assignPersonId: { not: null },
    };
    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };

    const persons = await this.prisma.repairPerson.findMany({
      where: { status: 'AVAILABLE' },
    });

    const results = [];

    for (const person of persons) {
      const personWhere = { ...where, assignPersonId: person.id };
      
      const [total, completed, onTime, delayed] = await Promise.all([
        this.prisma.repairOrder.count({ where: personWhere }),
        this.prisma.repairOrder.count({
          where: { ...personWhere, status: OrderStatus.CLOSED },
        }),
        this.prisma.repairOrder.count({
          where: { ...personWhere, status: OrderStatus.CLOSED, isOnTime: true },
        }),
        this.prisma.repairOrder.count({
          where: { ...personWhere, delayRecords: { some: {} } },
        }),
      ]);

      results.push({
        personId: person.id,
        personName: person.name,
        total,
        completed,
        onTime,
        delayed,
        onTimeRate: completed > 0 ? Math.round((onTime / completed) * 100) : 0,
      });
    }

    results.sort((a, b) => b.total - a.total);

    await this.redis.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }

  async getByReviewTags(startDate?: string, endDate?: string) {
    const cacheKey = `stats:review-tags:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {
      status: OrderStatus.CLOSED,
    };
    if (startDate) where.closeTime = { ...(where.closeTime || {}), gte: new Date(startDate) };
    if (endDate) where.closeTime = { ...(where.closeTime || {}), lte: new Date(endDate) };

    const tags = Object.values(ReviewTag);
    const results = [];

    for (const tag of tags) {
      const count = await this.prisma.repairOrder.count({
        where: {
          ...where,
          reviewTags: {
            has: tag,
          },
        },
      });

      results.push({
        tag,
        count,
      });
    }

    results.sort((a, b) => b.count - a.count);

    await this.redis.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }

  async getDelayReasons(startDate?: string, endDate?: string) {
    const cacheKey = `stats:delay-reasons:${startDate || 'all'}:${endDate || 'all'}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};
    if (startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(endDate) };

    const reasons = Object.values(DelayReason);
    const results = [];

    for (const reason of reasons) {
      const records = await this.prisma.delayRecord.findMany({
        where: { ...where, reason },
        select: { duration: true },
      });

      const totalDuration = records.reduce((sum, r) => sum + r.duration, 0);
      const count = records.length;

      results.push({
        reason,
        count,
        totalDuration,
        avgDuration: count > 0 ? Math.round(totalDuration / count) : 0,
      });
    }

    results.sort((a, b) => b.count - a.count);

    await this.redis.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }

  async getDailyTrend(days: number = 30) {
    const cacheKey = `stats:daily-trend:${days}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const results = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const where = {
        createdAt: {
          gte: date,
          lt: nextDay,
        },
      };

      const [total, completed, onTime] = await Promise.all([
        this.prisma.repairOrder.count({ where }),
        this.prisma.repairOrder.count({
          where: { ...where, status: OrderStatus.CLOSED },
        }),
        this.prisma.repairOrder.count({
          where: { ...where, status: OrderStatus.CLOSED, isOnTime: true },
        }),
      ]);

      results.push({
        date: date.toISOString().slice(0, 10),
        total,
        completed,
        onTime,
        onTimeRate: completed > 0 ? Math.round((onTime / completed) * 100) : 0,
      });
    }

    await this.redis.set(cacheKey, JSON.stringify(results), 300);

    return results;
  }
}
