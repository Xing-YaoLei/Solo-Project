import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, format, subDays, subMonths } from "date-fns";

export class ReportService {
  static async getOrderReport(startDate: Date, endDate: Date, regionId?: string) {
    const orders = await prisma.order.findMany({
      where: {
        orderedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(regionId && { regionId }),
      },
      include: {
        region: true,
        subsidy: true,
        payment: true,
      },
    });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dailyStats = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayOrders = orders.filter(
        (o) => o.orderedAt >= dayStart && o.orderedAt <= dayEnd
      );

      const deliveredOrders = dayOrders.filter((o) => o.status === "DELIVERED");
      const damagedOrders = dayOrders.filter((o) => o.status === "DAMAGED");

      return {
        date: format(day, "yyyy-MM-dd"),
        orderCount: dayOrders.length,
        deliveredCount: deliveredOrders.length,
        damagedCount: damagedOrders.length,
        totalSubsidy: dayOrders.reduce((sum, o) => sum + Number(o.subsidy?.amount || 0), 0),
        avgDispatchDuration: dayOrders.filter((o) => o.dispatchDuration).length > 0
          ? dayOrders.filter((o) => o.dispatchDuration).reduce((sum, o) => sum + (o.dispatchDuration || 0), 0) / dayOrders.filter((o) => o.dispatchDuration).length
          : 0,
        avgDeliveryDuration: deliveredOrders.filter((o) => o.deliveryDuration).length > 0
          ? deliveredOrders.filter((o) => o.deliveryDuration).reduce((sum, o) => sum + (o.deliveryDuration || 0), 0) / deliveredOrders.filter((o) => o.deliveryDuration).length
          : 0,
        damageRate: dayOrders.length > 0 ? (damagedOrders.length / dayOrders.length) * 100 : 0,
      };
    });

    const summary = {
      totalOrders: orders.length,
      totalDelivered: orders.filter((o) => o.status === "DELIVERED").length,
      totalDamaged: orders.filter((o) => o.status === "DAMAGED").length,
      totalSubsidy: orders.reduce((sum, o) => sum + Number(o.subsidy?.amount || 0), 0),
      avgOrderValue: orders.length > 0 
        ? orders.reduce((sum, o) => sum + Number(o.itemValue), 0) / orders.length 
        : 0,
      avgDispatchDuration: orders.filter((o) => o.dispatchDuration).length > 0
        ? orders.filter((o) => o.dispatchDuration).reduce((sum, o) => sum + (o.dispatchDuration || 0), 0) / orders.filter((o) => o.dispatchDuration).length
        : 0,
      damageRate: orders.length > 0 
        ? (orders.filter((o) => o.status === "DAMAGED").length / orders.length) * 100 
        : 0,
    };

    return { dailyStats, summary };
  }

  static async getRegionComparison(startDate: Date, endDate: Date) {
    const regions = await prisma.region.findMany();
    const subsidies = await prisma.subsidyRecord.findMany({
      where: {
        subsidyDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        region: true,
        order: true,
      },
    });

    return regions.map((region) => {
      const regionSubsidies = subsidies.filter((s) => s.regionId === region.id);
      const totalAmount = regionSubsidies.reduce((sum, s) => sum + Number(s.amount), 0);
      const orderCount = regionSubsidies.length;
      const avgDispatchDuration = regionSubsidies.filter((s) => s.order.dispatchDuration).length > 0
        ? regionSubsidies.filter((s) => s.order.dispatchDuration).reduce((sum, s) => sum + (s.order.dispatchDuration || 0), 0) / regionSubsidies.filter((s) => s.order.dispatchDuration).length
        : 0;

      return {
        regionId: region.id,
        regionName: region.name,
        city: region.city,
        totalSubsidy: totalAmount,
        orderCount,
        avgSubsidy: orderCount > 0 ? totalAmount / orderCount : 0,
        avgDispatchDuration,
      };
    }).sort((a, b) => b.totalSubsidy - a.totalSubsidy);
  }

  static async getDamageRecords(startDate: Date, endDate: Date, severity?: string) {
    const damageRecords = await prisma.damageRecord.findMany({
      where: {
        reportedAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(severity && { severity: severity as any }),
      },
      include: {
        order: {
          include: {
            region: true,
          },
        },
        compensation: true,
      },
      orderBy: { reportedAt: "desc" },
    });

    return damageRecords;
  }

  static async getSettlementDetails(startDate: Date, endDate: Date, status?: string) {
    const settlements = await prisma.settlementDetail.findMany({
      where: {
        settlementDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(status && { status: status as any }),
      },
      include: {
        order: {
          include: {
            region: true,
          },
        },
      },
      orderBy: { settlementDate: "desc" },
      take: 100,
    });

    return settlements;
  }

  static async getCompensationRecords(startDate: Date, endDate: Date) {
    const compensations = await prisma.compensationRecord.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        damage: {
          include: {
            order: {
              include: {
                region: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      totalCount: compensations.length,
      totalAmount: compensations.reduce((sum, c) => sum + Number(c.amount), 0),
      avgAmount: compensations.length > 0 
        ? compensations.reduce((sum, c) => sum + Number(c.amount), 0) / compensations.length 
        : 0,
    };

    return { records: compensations, summary };
  }

  static async getOrderDetail(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        region: true,
        payment: true,
        mapRecord: true,
        subsidy: {
          include: {
            rule: true,
            appeal: true,
          },
        },
        damage: {
          include: {
            compensation: true,
          },
        },
        settlement: true,
      },
    });
  }
}
