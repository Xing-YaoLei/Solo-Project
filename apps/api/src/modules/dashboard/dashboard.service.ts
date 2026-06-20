import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async overview(activityId?: string) {
    const cacheKey = `dashboard:overview:${activityId || 'all'}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (activityId) where.activityId = activityId;

    const [activities, ticketTypes, orders, exceptions, sponsors, checkInCodes] = await Promise.all([
      this.prisma.activity.count({ where: activityId ? { id: activityId } : undefined }),
      this.prisma.ticketType.findMany({ where }),
      this.prisma.order.findMany({ where }),
      this.prisma.exceptionRecord.findMany({ where }),
      this.prisma.sponsor.findMany({ where }),
      this.prisma.checkInCode.findMany({ where }),
    ]);

    const totalStock = ticketTypes.reduce((s, t) => s + t.totalStock, 0);
    const totalSold = ticketTypes.reduce((s, t) => s + t.soldCount, 0);
    const paidOrders = orders.filter((o) => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(o.status));
    const totalRevenue = paidOrders.reduce((s, o) => s + o.paidAmount.toNumber(), 0);
    const checkedIn = checkInCodes.filter((c) => c.status === 'CHECKED_IN').length;
    const openExceptions = exceptions.filter((e) => ['OPEN', 'INVESTIGATING', 'PENDING_RESPONSE'].includes(e.status));

    const orderStatusDistribution: Record<string, number> = {};
    orders.forEach((o) => (orderStatusDistribution[o.status] = (orderStatusDistribution[o.status] || 0) + 1));

    const ticketSales = ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      stock: t.totalStock,
      sold: t.soldCount,
      rate: t.totalStock ? t.soldCount / t.totalStock : 0,
      revenue: t.soldCount * t.price.toNumber(),
    }));

    const result = {
      kpis: {
        totalActivities: activities,
        totalStock,
        totalSold,
        soldRate: totalStock ? totalSold / totalStock : 0,
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalRevenue,
        totalSponsors: sponsors.length,
        totalSponsorAmount: sponsors.reduce((s, sp) => s + (sp.amount?.toNumber() || 0), 0),
        totalCheckIns: checkInCodes.length,
        checkedIn,
        checkInRate: checkInCodes.length ? checkedIn / checkInCodes.length : 0,
        exceptionCount: exceptions.length,
        openExceptionCount: openExceptions.length,
      },
      orderStatusDistribution,
      ticketSales,
      recentExceptions: exceptions.slice(0, 10).map((e) => ({
        id: e.id,
        exceptionNo: e.exceptionNo,
        type: e.type,
        title: e.title,
        status: e.status,
        severity: e.severity,
        createdAt: e.createdAt,
      })),
    };

    await this.redis.setJson(cacheKey, result, 30);
    return result;
  }
}
