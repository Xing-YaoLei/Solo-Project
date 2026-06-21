import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay, subDays } from "date-fns";

export interface TrendQuery {
  startDate: Date;
  endDate: Date;
  routeIds?: string[];
  areaIds?: string[];
  compareType?: "yoy" | "mom" | "none";
}

export interface CancelEvent {
  id: string;
  date: string;
  performanceName: string;
  performanceId: string;
  reason: string;
  affectedCount: number;
}

export interface RouteTrendData {
  id: string;
  name: string;
  color: string;
  data: { date: string; visitorCount: number }[];
}

export interface TrendResponse {
  dateRange: { start: string; end: string };
  routes: RouteTrendData[];
  cancelEvents: CancelEvent[];
  summary: {
    totalVisitors: number;
    avgDaily: number;
    growthRate: number;
    secondaryConsumptionTotal: number;
    secondaryConversionRate: number;
    secondaryConsumptionGrowth: number;
    secondaryConversionGrowth: number;
    activeRoutes: number;
    performanceCount: number;
    performanceGrowth: number;
    cameraVisitorCount: number;
    avgSeatOccupancy: number;
    avgSeatOccupancyGrowth: number;
    contractCount: number;
    caliberNotes: string[];
  };
}

export async function getRouteTrend(query: TrendQuery): Promise<TrendResponse> {
  const { startDate, endDate, routeIds, compareType = "none" } = query;

  const routes = await prisma.tourRoute.findMany({
    where: routeIds ? { id: { in: routeIds } } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { points: true } } },
  });

  const routeData: RouteTrendData[] = [];
  let totalVisitors = 0;
  const dailyTotals: Record<string, number> = {};

  for (const route of routes) {
    const dailyStats = await prisma.dailyRouteStat.findMany({
      where: {
        routeId: route.id,
        statDate: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      orderBy: { statDate: "asc" },
    });

    const data = dailyStats.map((stat) => {
      const dateStr = stat.statDate.toISOString().split("T")[0];
      totalVisitors += stat.visitorCount;
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + stat.visitorCount;
      return {
        date: dateStr,
        visitorCount: stat.visitorCount,
      };
    });

    routeData.push({
      id: route.id,
      name: route.name,
      color: route.color,
      data,
    });
  }

  const cancelEvents = await prisma.performanceCancel.findMany({
    where: {
      cancelTime: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    },
    include: { performance: true },
    orderBy: { cancelTime: "asc" },
  });

  const days = Object.keys(dailyTotals).length || 1;
  const avgDaily = Math.round(totalVisitors / days);

  let growthRate = 0;
  if (compareType !== "none") {
    const compareDays = days;
    const compareStart = subDays(startDate, compareDays);
    const compareEnd = subDays(endDate, compareDays);

    const prevStats = await prisma.dailyRouteStat.findMany({
      where: {
        statDate: { gte: startOfDay(compareStart), lte: endOfDay(compareEnd) },
      },
    });

    const prevTotal = prevStats.reduce((sum, s) => sum + s.visitorCount, 0);
    if (prevTotal > 0) {
      growthRate = ((totalVisitors - prevTotal) / prevTotal) * 100;
    }
  }

  const perfStart = startOfDay(startDate);
  const perfEnd = endOfDay(endDate);
  const performanceCount = await prisma.performance.count({
    where: { startTime: { gte: perfStart, lte: perfEnd } },
  });

  const [cameraStats, contracts, seatGroups, performances] = await Promise.all([
    prisma.cameraStat.findMany({
      where: { statDate: { gte: startOfDay(startDate), lte: endOfDay(endDate) } },
      select: { visitorCount: true },
    }),
    prisma.contract.findMany({
      where: { endDate: { gte: startOfDay(startDate) } },
      select: { caliberNote: true },
    }),
    prisma.seat.groupBy({
      by: ["performanceId", "status"],
      where: { performance: { startTime: { gte: perfStart, lte: perfEnd } } },
      _count: { status: true },
    }),
    prisma.performance.findMany({
      where: { startTime: { gte: perfStart, lte: perfEnd } },
      select: { id: true, totalSeats: true },
    }),
  ]);

  const cameraVisitorCount = cameraStats.reduce((s, c) => s + c.visitorCount, 0);
  const contractCount = contracts.length;
  const caliberNotes = contracts.map(c => c.caliberNote).filter(Boolean).slice(0, 3);

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
  let avgSeatOccupancy = 0;
  if (perfSeatMap.size > 0) {
    let totalOccupancy = 0;
    for (const entry of perfSeatMap.values()) {
      totalOccupancy += entry.total > 0 ? (entry.sold / entry.total) * 100 : 0;
    }
    avgSeatOccupancy = totalOccupancy / perfSeatMap.size;
  }

  const orderFilter = { orderTime: { gte: startOfDay(startDate), lte: endOfDay(endDate) }, status: "paid" };
  const [merchantOrders, miniappOrders] = await Promise.all([
    prisma.merchantOrder.findMany({ where: orderFilter, select: { amount: true } }),
    prisma.miniappOrder.findMany({ where: orderFilter, select: { amount: true } }),
  ]);

  const merchantTotal = merchantOrders.reduce((sum, o) => sum + o.amount, 0);
  const miniappTotal = miniappOrders.reduce((sum, o) => sum + o.amount, 0);
  const secondaryConsumptionTotal = merchantTotal + miniappTotal;
  const secondaryConversionRate = totalVisitors > 0
    ? ((merchantOrders.length + miniappOrders.length) / totalVisitors) * 100
    : 0;

  let secondaryConsumptionGrowth = 0;
  let secondaryConversionGrowth = 0;
  let performanceGrowth = 0;
  let avgSeatOccupancyGrowth = 0;

  if (compareType !== "none") {
    const compareDays = days;
    const compareStart = subDays(startDate, compareDays);
    const compareEnd = subDays(endDate, compareDays);
    const compareOrderFilter = { orderTime: { gte: startOfDay(compareStart), lte: endOfDay(compareEnd) }, status: "paid" };
    const comparePerfStart = startOfDay(compareStart);
    const comparePerfEnd = endOfDay(compareEnd);

    const [prevMerchant, prevMiniapp, prevPerfCount, prevSeatGroups, prevPerformances] = await Promise.all([
      prisma.merchantOrder.findMany({ where: compareOrderFilter, select: { amount: true } }),
      prisma.miniappOrder.findMany({ where: compareOrderFilter, select: { amount: true } }),
      prisma.performance.count({ where: { startTime: { gte: comparePerfStart, lte: comparePerfEnd } } }),
      prisma.seat.groupBy({
        by: ["performanceId", "status"],
        where: { performance: { startTime: { gte: comparePerfStart, lte: comparePerfEnd } } },
        _count: { status: true },
      }),
      prisma.performance.findMany({
        where: { startTime: { gte: comparePerfStart, lte: comparePerfEnd } },
        select: { id: true, totalSeats: true },
      }),
    ]);

    const prevPerfSeatMap = new Map<string, { sold: number; total: number }>();
    for (const p of prevPerformances) {
      prevPerfSeatMap.set(p.id, { sold: 0, total: p.totalSeats });
    }
    for (const g of prevSeatGroups) {
      if (g.status === "sold") {
        const entry = prevPerfSeatMap.get(g.performanceId);
        if (entry) entry.sold = g._count.status;
      }
    }
    let prevAvgSeatOccupancy = 0;
    if (prevPerfSeatMap.size > 0) {
      let totalOcc = 0;
      for (const entry of prevPerfSeatMap.values()) {
        totalOcc += entry.total > 0 ? (entry.sold / entry.total) * 100 : 0;
      }
      prevAvgSeatOccupancy = totalOcc / prevPerfSeatMap.size;
    }

    const prevTotal = prevMerchant.reduce((s, o) => s + o.amount, 0) + prevMiniapp.reduce((s, o) => s + o.amount, 0);
    const prevOrderCount = prevMerchant.length + prevMiniapp.length;
    const prevStats = await prisma.dailyRouteStat.findMany({
      where: { statDate: { gte: startOfDay(compareStart), lte: endOfDay(compareEnd) } },
    });
    const prevVisitors = prevStats.reduce((s, st) => s + st.visitorCount, 0);

    if (prevTotal > 0) {
      secondaryConsumptionGrowth = ((secondaryConsumptionTotal - prevTotal) / prevTotal) * 100;
    }
    if (prevVisitors > 0 && prevOrderCount > 0) {
      const prevRate = (prevOrderCount / prevVisitors) * 100;
      secondaryConversionGrowth = prevRate > 0 ? ((secondaryConversionRate - prevRate) / prevRate) * 100 : 0;
    }
    if (prevPerfCount > 0) {
      performanceGrowth = ((performanceCount - prevPerfCount) / prevPerfCount) * 100;
    }
    if (prevAvgSeatOccupancy > 0) {
      avgSeatOccupancyGrowth = ((avgSeatOccupancy - prevAvgSeatOccupancy) / prevAvgSeatOccupancy) * 100;
    }
  }

  return {
    dateRange: {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    },
    routes: routeData,
    cancelEvents: cancelEvents.map((e) => ({
      id: e.id,
      date: e.cancelTime.toISOString().split("T")[0],
      performanceName: e.performance.name,
      performanceId: e.performanceId,
      reason: e.reason,
      affectedCount: e.affectedCount,
    })),
    summary: {
      totalVisitors,
      avgDaily,
      growthRate: Math.round(growthRate * 100) / 100,
      secondaryConsumptionTotal: Math.round(secondaryConsumptionTotal * 100) / 100,
      secondaryConversionRate: Math.round(secondaryConversionRate * 10) / 10,
      secondaryConsumptionGrowth: Math.round(secondaryConsumptionGrowth * 10) / 10,
      secondaryConversionGrowth: Math.round(secondaryConversionGrowth * 10) / 10,
      activeRoutes: routeData.length,
      performanceCount,
      performanceGrowth: Math.round(performanceGrowth * 10) / 10,
      cameraVisitorCount,
      avgSeatOccupancy: Math.round(avgSeatOccupancy * 10) / 10,
      avgSeatOccupancyGrowth: Math.round(avgSeatOccupancyGrowth * 10) / 10,
      contractCount,
      caliberNotes,
    },
  };
}

export async function getHeatmapData(date: Date, compareType?: "yoy" | "mom") {
  const areas = await prisma.area.findMany({
    include: { _count: { select: { children: true } } },
  });

  const currentStats = await prisma.dailyAreaStat.findMany({
    where: {
      statDate: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
  });

  let compareStats: typeof currentStats = [];
  if (compareType) {
    const compareDate = compareType === "yoy" 
      ? new Date(date.getFullYear() - 1, date.getMonth(), date.getDate())
      : subDays(date, 30);

    compareStats = await prisma.dailyAreaStat.findMany({
      where: {
        statDate: {
          gte: startOfDay(compareDate),
          lte: endOfDay(compareDate),
        },
      },
    });
  }

  return areas.map((area) => {
    const stat = currentStats.find((s) => s.areaId === area.id);
    const compareStat = compareStats.find((s) => s.areaId === area.id);

    const visitorCount = stat?.visitorCount || 0;
    const compareCount = compareStat?.visitorCount || 0;
    const growthRate = compareCount > 0 
      ? ((visitorCount - compareCount) / compareCount) * 100 
      : 0;

    return {
      id: area.id,
      name: area.name,
      lng: area.lng ? Number(area.lng) : null,
      lat: area.lat ? Number(area.lat) : null,
      visitorCount,
      growthRate: Math.round(growthRate * 100) / 100,
      hasChildren: area._count.children > 0,
    };
  });
}
