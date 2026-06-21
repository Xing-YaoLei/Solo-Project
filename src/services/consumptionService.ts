import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay, subDays, format } from "date-fns";

export interface ConsumptionQuery {
  startDate: Date;
  endDate: Date;
  areaIds?: string[];
  compareType: "date" | "area";
}

export interface FunnelStage {
  stage: string;
  count: number;
  rate: number;
}

export interface ComparisonItem {
  label: string;
  amount: number;
  conversionRate: number;
  avgPrice: number;
  orderCount: number;
  yoyGrowth: number;
  momGrowth: number;
}

export interface ConsumptionResponse {
  funnel: FunnelStage[];
  comparison: ComparisonItem[];
  kpi: {
    totalAmount: number;
    orderCount: number;
    conversionRate: number;
    avgPrice: number;
    totalAmountGrowth: number;
    orderCountGrowth: number;
    conversionRateGrowth: number;
    avgPriceGrowth: number;
    cameraVisitorCount: number;
    routeVisitorCount: number;
    avgSeatOccupancy: number;
    totalPerformances: number;
    soldSeats: number;
    totalSeats: number;
  };
}

export async function getSecondaryConsumption(
  query: ConsumptionQuery
): Promise<ConsumptionResponse> {
  const { startDate, endDate, areaIds, compareType } = query;

  const [
    merchantOrders,
    miniappOrders,
    cameraStats,
    seatGroups,
    performances,
  ] = await Promise.all([
    prisma.merchantOrder.findMany({
      where: {
        orderTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
        status: "paid",
        merchant: areaIds ? { areaId: { in: areaIds } } : undefined,
      },
      include: { merchant: true },
    }),
    prisma.miniappOrder.findMany({
      where: {
        orderTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
        status: "paid",
      },
    }),
    prisma.cameraStat.aggregate({
      _sum: { visitorCount: true },
      where: { statDate: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
    }),
    prisma.seat.groupBy({
      by: ["performanceId", "status"],
      where: { performance: { startTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) } } },
      _count: { status: true },
    }),
    prisma.performance.findMany({
      where: { startTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
      select: { id: true, totalSeats: true },
    }),
  ]);

  const cameraVisitorCount = cameraStats._sum.visitorCount ?? 0;
  const perfSeatMap = new Map<string, { sold: number; total: number }>();
  for (const p of performances) {
    perfSeatMap.set(p.id, { sold: 0, total: p.totalSeats });
  }
  for (const g of seatGroups) {
    if (g.status === "sold") {
      const entry = perfSeatMap.get(g.performanceId);
      if (entry) entry.sold = g._count.status;
    }
  }
  let totalSoldSeats = 0;
  let totalAllSeats = 0;
  let avgSeatOccupancy = 0;
  if (perfSeatMap.size > 0) {
    let totalOcc = 0;
    for (const entry of perfSeatMap.values()) {
      totalSoldSeats += entry.sold;
      totalAllSeats += entry.total;
      totalOcc += entry.total > 0 ? (entry.sold / entry.total) * 100 : 0;
    }
    avgSeatOccupancy = totalOcc / perfSeatMap.size;
  }

  const totalPaidAmount = merchantOrders.reduce(
    (sum, o) => sum + Number(o.amount),
    0
  ) + miniappOrders.reduce((sum, o) => sum + Number(o.amount), 0);
  const paidOrderCount = merchantOrders.length + miniappOrders.length;
  const avgPrice = paidOrderCount > 0 ? totalPaidAmount / paidOrderCount : 0;

  const allOrders = await prisma.merchantOrder.findMany({
    where: { orderTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
    select: { status: true },
  });
  const totalOrderCount = allOrders.length;
  const paidCount = allOrders.filter((o) => o.status === "paid").length;

  const visitorStats = await prisma.dailyRouteStat.aggregate({
    _sum: { visitorCount: true },
    where: { statDate: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
  });
  const totalVisitors = visitorStats._sum.visitorCount ?? 0;

  const miniappUsers = await prisma.miniappUser.count({
    where: { createdAt: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
  });
  const browserCount = Math.max(Math.floor(totalVisitors * 1.6), miniappUsers * 3);

  const conversionRate = totalVisitors > 0 ? (paidOrderCount / totalVisitors) * 100 : 0;

  const funnel: FunnelStage[] = [
    { stage: "浏览用户", count: browserCount, rate: 100 },
    { stage: "访问用户", count: totalVisitors, rate: browserCount > 0 ? (totalVisitors / browserCount) * 100 : 0 },
    { stage: "下单用户", count: totalOrderCount, rate: totalVisitors > 0 ? (totalOrderCount / totalVisitors) * 100 : 0 },
    { stage: "支付完成", count: paidCount, rate: totalOrderCount > 0 ? (paidCount / totalOrderCount) * 100 : 0 },
  ];

  let comparison: ComparisonItem[] = [];

  if (compareType === "date") {
    const days = 7;
    const dateList: Date[] = [];
    for (let i = 0; i < days; i++) {
      dateList.push(subDays(endDate, days - 1 - i));
    }

    const dailyVisitors = await prisma.dailyRouteStat.groupBy({
      by: ["statDate"],
      _sum: { visitorCount: true },
      where: {
        statDate: {
          gte: startOfDay(dateList[0]),
          lte: endOfDay(dateList[dateList.length - 1]),
        },
      },
    });
    const visitorMap = new Map<string, number>();
    dailyVisitors.forEach((dv) => {
      visitorMap.set(dv.statDate.toISOString().split("T")[0], dv._sum.visitorCount ?? 0);
    });

    for (const date of dateList) {
      const dateStr = date.toISOString().split("T")[0];
      const dayOrders = merchantOrders.filter((o) => {
        const orderDate = new Date(o.orderTime);
        return orderDate.toDateString() === date.toDateString();
      });
      const dayMiniappOrders = miniappOrders.filter((o) => {
        const orderDate = new Date(o.orderTime);
        return orderDate.toDateString() === date.toDateString();
      });
      const dayAllCount = dayOrders.length + dayMiniappOrders.length;
      const dayAmount = dayOrders.reduce((sum, o) => sum + Number(o.amount), 0)
        + dayMiniappOrders.reduce((sum, o) => sum + Number(o.amount), 0);
      const dayVisitors = visitorMap.get(dateStr) ?? 0;

      const momDate = subDays(date, 7);
      const yoyDate = subDays(date, 365);
      const [momOrders, yoyOrders, momVisitors, yoyVisitors] = await Promise.all([
        prisma.merchantOrder.findMany({
          where: {
            orderTime: { gte: startOfDay(momDate), lte: endOfDay(momDate) },
            status: "paid",
          },
          select: { amount: true },
        }),
        prisma.merchantOrder.findMany({
          where: {
            orderTime: { gte: startOfDay(yoyDate), lte: endOfDay(yoyDate) },
            status: "paid",
          },
          select: { amount: true },
        }),
        prisma.dailyRouteStat.aggregate({
          _sum: { visitorCount: true },
          where: { statDate: { gte: startOfDay(momDate), lte: endOfDay(momDate) } },
        }),
        prisma.dailyRouteStat.aggregate({
          _sum: { visitorCount: true },
          where: { statDate: { gte: startOfDay(yoyDate), lte: endOfDay(yoyDate) } },
        }),
      ]);
      const momAmount = momOrders.reduce((s, o) => s + Number(o.amount), 0);
      const yoyAmount = yoyOrders.reduce((s, o) => s + Number(o.amount), 0);
      const momGrowth = momAmount > 0 ? ((dayAmount - momAmount) / momAmount) * 100 : 0;
      const yoyGrowth = yoyAmount > 0 ? ((dayAmount - yoyAmount) / yoyAmount) * 100 : 0;

      comparison.push({
        label: format(date, "MM-dd"),
        amount: Math.round(dayAmount),
        conversionRate: dayVisitors > 0 ? (dayAllCount / dayVisitors) * 100 : 0,
        avgPrice: dayAllCount > 0 ? dayAmount / dayAllCount : 0,
        orderCount: dayAllCount,
        yoyGrowth: Math.round(yoyGrowth * 10) / 10,
        momGrowth: Math.round(momGrowth * 10) / 10,
      });
    }
  } else {
    const areas = await prisma.area.findMany({
      where: areaIds ? { id: { in: areaIds } } : undefined,
      include: { merchants: true },
    });

    const areaVisitors = await prisma.dailyAreaStat.groupBy({
      by: ["areaId"],
      _sum: { visitorCount: true },
      where: {
        statDate: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
      },
    });
    const areaVisitorMap = new Map<string, number>();
    areaVisitors.forEach((av) => {
      areaVisitorMap.set(av.areaId, av._sum.visitorCount ?? 0);
    });

    for (const area of areas) {
      const areaMerchantIds = area.merchants.map((m) => m.id);
      const areaOrders = merchantOrders.filter((o) =>
        areaMerchantIds.includes(o.merchantId)
      );
      const areaAmount = areaOrders.reduce((sum, o) => sum + Number(o.amount), 0);
      const areaVisitorsCount = areaVisitorMap.get(area.id) ?? 0;

      const areaMom = await prisma.dailyAreaStat.aggregate({
        _sum: { visitorCount: true },
        where: {
          areaId: area.id,
          statDate: {
            gte: startOfDay(subDays(startDate, 7)),
            lte: endOfDay(subDays(endDate, 7)),
          },
        },
      });
      const areaMomOrders = await prisma.merchantOrder.findMany({
        where: {
          merchantId: { in: areaMerchantIds },
          orderTime: {
            gte: startOfDay(subDays(startDate, 7)),
            lte: endOfDay(subDays(endDate, 7)),
          },
          status: "paid",
        },
        select: { amount: true },
      });
      const areaYoyOrders = await prisma.merchantOrder.findMany({
        where: {
          merchantId: { in: areaMerchantIds },
          orderTime: {
            gte: startOfDay(subDays(startDate, 365)),
            lte: endOfDay(subDays(endDate, 365)),
          },
          status: "paid",
        },
        select: { amount: true },
      });

      const momAmount = areaMomOrders.reduce((s, o) => s + Number(o.amount), 0);
      const yoyAmount = areaYoyOrders.reduce((s, o) => s + Number(o.amount), 0);
      const momGrowth = momAmount > 0 ? ((areaAmount - momAmount) / momAmount) * 100 : 0;
      const yoyGrowth = yoyAmount > 0 ? ((areaAmount - yoyAmount) / yoyAmount) * 100 : 0;

      comparison.push({
        label: area.name,
        amount: Math.round(areaAmount),
        conversionRate: areaVisitorsCount > 0 ? (areaOrders.length / areaVisitorsCount) * 100 : 0,
        avgPrice: areaOrders.length > 0 ? areaAmount / areaOrders.length : 0,
        orderCount: areaOrders.length,
        yoyGrowth: Math.round(yoyGrowth * 10) / 10,
        momGrowth: Math.round(momGrowth * 10) / 10,
      });
    }
  }

  const days = Math.ceil(
    (endOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const compareStart = subDays(startDate, days);
  const compareEnd = subDays(endDate, days);

  const [
    prevMerchant,
    prevMiniapp,
    prevVisitorStats,
  ] = await Promise.all([
    prisma.merchantOrder.findMany({
      where: { orderTime: { gte: startOfDay(compareStart), lte: endOfDay(compareEnd) }, status: "paid" },
      select: { amount: true },
    }),
    prisma.miniappOrder.findMany({
      where: { orderTime: { gte: startOfDay(compareStart), lte: endOfDay(compareEnd) }, status: "paid" },
      select: { amount: true },
    }),
    prisma.dailyRouteStat.aggregate({
      _sum: { visitorCount: true },
      where: { statDate: { gte: startOfDay(compareStart), lte: endOfDay(compareEnd) } },
    }),
  ]);

  const prevAmount = prevMerchant.reduce((s, o) => s + Number(o.amount), 0)
    + prevMiniapp.reduce((s, o) => s + Number(o.amount), 0);
  const prevOrderCount = prevMerchant.length + prevMiniapp.length;
  const prevVisitors = prevVisitorStats._sum.visitorCount ?? 0;
  const prevRate = prevVisitors > 0 ? (prevOrderCount / prevVisitors) * 100 : 0;
  const prevAvgPrice = prevOrderCount > 0 ? prevAmount / prevOrderCount : 0;

  const totalAmountGrowth = prevAmount > 0 ? ((totalPaidAmount - prevAmount) / prevAmount) * 100 : 0;
  const orderCountGrowth = prevOrderCount > 0 ? ((paidOrderCount - prevOrderCount) / prevOrderCount) * 100 : 0;
  const conversionRateGrowth = prevRate > 0 ? ((conversionRate - prevRate) / prevRate) * 100 : 0;
  const avgPriceGrowth = prevAvgPrice > 0 ? ((avgPrice - prevAvgPrice) / prevAvgPrice) * 100 : 0;

  return {
    funnel,
    comparison: comparison.map((item) => ({
      ...item,
      conversionRate: Math.round(item.conversionRate * 100) / 100,
      avgPrice: Math.round(item.avgPrice * 100) / 100,
    })),
    kpi: {
      totalAmount: Math.round(totalPaidAmount * 100) / 100,
      orderCount: paidOrderCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgPrice: Math.round(avgPrice * 100) / 100,
      totalAmountGrowth: Math.round(totalAmountGrowth * 10) / 10,
      orderCountGrowth: Math.round(orderCountGrowth * 10) / 10,
      conversionRateGrowth: Math.round(conversionRateGrowth * 10) / 10,
      avgPriceGrowth: Math.round(avgPriceGrowth * 10) / 10,
      cameraVisitorCount,
      routeVisitorCount: totalVisitors,
      avgSeatOccupancy: Math.round(avgSeatOccupancy * 10) / 10,
      totalPerformances: performances.length,
      soldSeats: totalSoldSeats,
      totalSeats: totalAllSeats,
    },
  };
}
