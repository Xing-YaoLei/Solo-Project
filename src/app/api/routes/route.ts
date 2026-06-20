import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AlertSeverity } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenicAreaId = searchParams.get("scenicAreaId");

    const routes = await prisma.guideRoute.findMany({
      where: scenicAreaId ? { scenicAreaId } : undefined,
      include: {
        scenicArea: { select: { id: true, name: true } },
        stops: {
          include: {
            cameraStatistics: {
              orderBy: { recordedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { stopOrder: "asc" },
        },
        riskAlerts: {
          where: { isResolved: false },
        },
        orders: {
          where: {
            visitDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
    });

    const summaries = routes.map((route) => {
      const currentVisitors = route.stops.reduce(
        (sum: number, stop: typeof route.stops[number]) => {
          const latestStat = stop.cameraStatistics[0];
          return sum + (latestStat?.visitorCount ?? 0);
        },
        0
      );

      const totalCapacity = route.stops.reduce(
        (sum: number, stop: typeof route.stops[number]) => sum + stop.capacity,
        0
      );

      const todayRevenue = route.orders.reduce(
        (sum: number, order: typeof route.orders[number]) => sum + order.totalAmount,
        0
      );

      const todayVisitors = route.orders.reduce(
        (sum: number, order: typeof route.orders[number]) => sum + order.visitorCount,
        0
      );

      const alertCount = route.riskAlerts.length;
      const criticalAlertCount = route.riskAlerts.filter(
        (a: { severity: AlertSeverity }) => a.severity === "CRITICAL"
      ).length;

      let riskLevel: string = "LOW";
      if (criticalAlertCount > 0) riskLevel = "CRITICAL";
      else if (alertCount >= 3) riskLevel = "HIGH";
      else if (alertCount >= 1) riskLevel = "MEDIUM";

      return {
        routeId: route.id,
        routeName: route.name,
        scenicAreaId: route.scenicAreaId,
        scenicAreaName: route.scenicArea.name,
        totalVisitors: todayVisitors,
        currentVisitors,
        capacityUtilization:
          totalCapacity > 0 ? currentVisitors / totalCapacity : 0,
        totalRevenue: todayRevenue,
        revenueDelta: 0,
        alertCount,
        criticalAlertCount,
        riskLevel,
        lastUpdated: new Date(),
        stops: route.stops.map((stop: typeof route.stops[number]) => ({
          id: stop.id,
          name: stop.name,
          type: stop.type,
          stopOrder: stop.stopOrder,
          capacity: stop.capacity,
          currentVisitors: stop.cameraStatistics[0]?.visitorCount ?? 0,
          congestionLevel: stop.cameraStatistics[0]?.congestionLevel ?? "LOW",
          avgStayMinutes: stop.cameraStatistics[0]?.avgStayMinutes ?? 0,
        })),
      };
    });

    return NextResponse.json(summaries);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}
