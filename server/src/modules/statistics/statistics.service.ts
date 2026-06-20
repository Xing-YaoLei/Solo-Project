import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma';
import { redis } from '../../redis';
import { OccupancyTrendQueryDto, OccupancySummaryQueryDto } from './statistics.dto';
import crypto from 'crypto';

const CACHE_TTL = 300;

function cacheKey(endpoint: string, params: Record<string, unknown>): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
  return `stats:${endpoint}:${hash}`;
}

async function getOrSet<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const result = await fn();
  await redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL);
  return result;
}

@Injectable()
export class StatisticsService {
  async getOccupancy(eventId: string) {
    const key = cacheKey('occupancy', { eventId });
    return getOrSet(key, () => this.computeOccupancy(eventId));
  }

  private async computeOccupancy(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const seatMaps = await prisma.seatMap.findMany({
      where: { eventId },
      include: {
        zones: {
          include: {
            _count: {
              select: { seats: { where: { status: 'sold' } } },
            },
            seats: {
              select: { status: true },
            },
          },
        },
      },
    });

    let totalSeats = 0;
    let soldSeats = 0;
    let availableSeats = 0;
    let lockedSeats = 0;

    const zoneBreakdown: {
      zoneId: string;
      zoneName: string;
      area: string;
      totalSeats: number;
      soldSeats: number;
      occupancyRate: number;
    }[] = [];

    for (const seatMap of seatMaps) {
      totalSeats += seatMap.totalSeats;

      for (const zone of seatMap.zones) {
        const zoneTotal = zone.seats.length;
        const zoneSold = zone._count.seats;
        const zoneAvailable = zone.seats.filter((s) => s.status === 'available').length;

        soldSeats += zoneSold;
        availableSeats += zoneAvailable;

        const lockedInZone = zone.seats.filter((s) => s.status === 'locked').length;
        lockedSeats += lockedInZone;

        zoneBreakdown.push({
          zoneId: zone.id,
          zoneName: zone.name,
          area: zone.area,
          totalSeats: zoneTotal,
          soldSeats: zoneSold,
          occupancyRate: zoneTotal > 0 ? Math.round((zoneSold / zoneTotal) * 10000) / 100 : 0,
        });
      }
    }

    const occupancyRate = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 10000) / 100 : 0;

    let status: string = 'normal';
    if (seatMaps.length > 0) {
      const maxThresholdFull = Math.max(...seatMaps.map((sm) => sm.thresholdFull));
      const maxThresholdWarn = Math.max(...seatMaps.map((sm) => sm.thresholdWarn));
      if (occupancyRate >= maxThresholdFull) status = 'full';
      else if (occupancyRate >= maxThresholdWarn) status = 'warning';
    }

    return {
      eventId,
      eventName: event.name,
      totalSeats,
      soldSeats,
      availableSeats,
      lockedSeats,
      occupancyRate,
      status,
      zoneBreakdown,
    };
  }

  async getOccupancyTrend(eventId: string, query: OccupancyTrendQueryDto) {
    const key = cacheKey('occupancy-trend', { eventId, ...query });
    return getOrSet(key, () => this.computeOccupancyTrend(eventId, query));
  }

  private async computeOccupancyTrend(eventId: string, query: OccupancyTrendQueryDto) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : new Date(event.createdAt);
    const dateTo = query.dateTo ? new Date(query.dateTo) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        eventId,
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const seatCount = await prisma.seat.count({
      where: { zone: { seatMap: { eventId } } },
    });

    const dailyMap = new Map<string, number>();

    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }

    const trend: { date: string; orderCount: number; cumulativeOrders: number; cumulativeOccupancy: number }[] = [];
    let cumulative = 0;

    const cursor = new Date(dateFrom);
    while (cursor <= dateTo) {
      const day = cursor.toISOString().slice(0, 10);
      const count = dailyMap.get(day) ?? 0;
      cumulative += count;
      trend.push({
        date: day,
        orderCount: count,
        cumulativeOrders: cumulative,
        cumulativeOccupancy: seatCount > 0 ? Math.round((cumulative / seatCount) * 10000) / 100 : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { eventId, eventName: event.name, totalSeats: seatCount, trend };
  }

  async getOccupancySummary(query: OccupancySummaryQueryDto) {
    const key = cacheKey('occupancy-summary', { ...query });
    return getOrSet(key, () => this.computeOccupancySummary(query));
  }

  private async computeOccupancySummary(query: OccupancySummaryQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.status) where.status = query.status;
    if (query.managerId) where.managerId = query.managerId;

    if (query.dateFrom || query.dateTo) {
      where.eventDate = {
        ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
        ...(query.dateTo && { lte: new Date(query.dateTo) }),
      };
    }

    const events = await prisma.event.findMany({
      where,
      select: { id: true, name: true, eventDate: true, status: true },
      orderBy: { eventDate: 'desc' },
    });

    const results: {
      eventId: string;
      eventName: string;
      eventDate: Date;
      status: string;
      totalSeats: number;
      soldSeats: number;
      occupancyRate: number;
    }[] = [];

    for (const ev of events) {
      const seatMaps = await prisma.seatMap.findMany({
        where: { eventId: ev.id },
        select: { totalSeats: true, thresholdWarn: true, thresholdFull: true },
      });

      const totalSeats = seatMaps.reduce((sum, sm) => sum + sm.totalSeats, 0);

      const soldCount = await prisma.seat.count({
        where: {
          zone: { seatMap: { eventId: ev.id } },
          status: 'sold',
        },
      });

      const occupancyRate = totalSeats > 0 ? Math.round((soldCount / totalSeats) * 10000) / 100 : 0;

      results.push({
        eventId: ev.id,
        eventName: ev.name,
        eventDate: ev.eventDate,
        status: ev.status,
        totalSeats,
        soldSeats: soldCount,
        occupancyRate,
      });
    }

    return results;
  }

  async getRevenue(eventId: string) {
    const key = cacheKey('revenue', { eventId });
    return getOrSet(key, () => this.computeRevenue(eventId));
  }

  private async computeRevenue(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      select: { id: true, name: true, soldCount: true, price: true },
    });

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { eventId },
        status: 'valid',
      },
      select: {
        ticketTypeId: true,
        unitPrice: true,
      },
    });

    const byTicketTypeMap = new Map<string, { name: string; soldCount: number; revenue: number }>();

    for (const tt of ticketTypes) {
      byTicketTypeMap.set(tt.id, {
        name: tt.name,
        soldCount: 0,
        revenue: 0,
      });
    }

    let totalRevenue = 0;

    for (const item of orderItems) {
      const entry = byTicketTypeMap.get(item.ticketTypeId);
      const price = Number(item.unitPrice);
      if (entry) {
        entry.soldCount += 1;
        entry.revenue += price;
      }
      totalRevenue += price;
    }

    const byTicketType = Array.from(byTicketTypeMap.entries()).map(([, val]) => ({
      name: val.name,
      soldCount: val.soldCount,
      revenue: Math.round(val.revenue * 100) / 100,
    }));

    return {
      eventId,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      byTicketType,
    };
  }
}
