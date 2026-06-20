import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.activity.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.activity.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.activity.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.activity.delete({ where: { id } });
  }

  async summary(activityId: string) {
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.activity.findUnique({ where: { id: activityId } });
      const ticketTypes = await tx.ticketType.findMany({ where: { activityId } });
      const orders = await tx.order.findMany({ where: { activityId } });
      const sponsors = await tx.sponsor.count({ where: { activityId } });
      const exceptions = await tx.exceptionRecord.findMany({ where: { activityId } });
      const checkInCodes = await tx.checkInCode.findMany({ where: { activityId } });

      const totalStock = ticketTypes.reduce((s, t) => s + t.totalStock, 0);
      const totalSold = ticketTypes.reduce((s, t) => s + t.soldCount, 0);
      const totalRevenue = orders
        .filter((o) => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(o.status))
        .reduce((s, o) => s + o.paidAmount.toNumber(), 0);
      const checkInCount = checkInCodes.filter((c) => c.status === 'CHECKED_IN').length;

      return {
        activity,
        ticketTypes,
        stats: {
          totalTickets: totalStock,
          soldCount: totalSold,
          soldRate: totalStock > 0 ? totalSold / totalStock : 0,
          totalRevenue,
          orderCount: orders.length,
          paidOrderCount: orders.filter((o) => ['PAID', 'CONFIRMED', 'COMPLETED'].includes(o.status)).length,
          sponsorCount: sponsors,
          exceptionCount: exceptions.length,
          exceptionOpenCount: exceptions.filter((e) =>
            ['OPEN', 'INVESTIGATING', 'PENDING_RESPONSE'].includes(e.status),
          ).length,
          checkInTotal: checkInCodes.length,
          checkInCount,
          checkInRate: checkInCodes.length > 0 ? checkInCount / checkInCodes.length : 0,
        },
      };
    });
  }
}
