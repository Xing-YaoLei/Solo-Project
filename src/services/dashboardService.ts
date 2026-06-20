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
