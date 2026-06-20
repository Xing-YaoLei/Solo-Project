import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCleanedOrdersForRoute, getCaliberMatchedData } from "@/lib/cleaned-data";
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
          orderBy: { stopOrder: "asc" },
        },
        riskAlerts: {
          where: { isResolved: false },
        },
      },
    });

    const effectiveAreaId = scenicAreaId ?? (routes[0]?.scenicAreaId);

    let caliberData: Awaited<ReturnType<typeof getCaliberMatchedData>> = [];

    if (effectiveAreaId) {
      caliberData = await getCaliberMatchedData(effectiveAreaId);
    }

    const cameraVisitorByStop = new Map<string, number>();
    const cameraCongestionByStop = new Map<string, string>();
    const cameraStayByStop = new Map<string, number>();
    for (const record of caliberData) {
      const stopId = record.cameraStatistic.stopId;
      const existing = cameraVisitorByStop.get(stopId) ?? 0;
      if (record.visitorCount > existing) {
        cameraVisitorByStop.set(stopId, record.visitorCount);
        cameraCongestionByStop.set(stopId, record.cameraStatistic.congestionLevel);
        cameraStayByStop.set(stopId, record.cameraStatistic.avgStayMinutes);
      }
    }

    const summaries = await Promise.all(
      routes.map(async (route) => {
        const currentVisitors = route.stops.reduce(
          (sum: number, stop: { id: string }) => {
            return sum + (cameraVisitorByStop.get(stop.id) ?? 0);
          },
          0
        );

        const totalCapacity = route.stops.reduce(
          (sum: number, stop: { capacity: number }) => sum + stop.capacity,
          0
        );

        let todayRevenue = 0;
        let todayVisitors = 0;
        if (effectiveAreaId) {
          const cleanedOrders = await getCleanedOrdersForRoute(effectiveAreaId, route.id);
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayOrders = cleanedOrders.filter(
            (o) => new Date(o.visitDate) >= todayStart
          );
          todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          todayVisitors = todayOrders.reduce((sum, o) => sum + o.visitorCount, 0);
        }

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
            currentVisitors: cameraVisitorByStop.get(stop.id) ?? 0,
            congestionLevel: cameraCongestionByStop.get(stop.id) ?? "LOW",
            avgStayMinutes: cameraStayByStop.get(stop.id) ?? 0,
          })),
        };
      })
    );

    return NextResponse.json(summaries);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}
