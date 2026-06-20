import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCleanedOrders, getCaliberMatchedData } from "@/lib/cleaned-data";
import type { AlertSeverity } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenicAreaId = searchParams.get("scenicAreaId");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      cancelledPerformances,
      activeAlerts,
      routes,
    ] = await Promise.all([
      prisma.performance.count({
        where: {
          ...(scenicAreaId ? { scenicAreaId } : {}),
          status: "CANCELLED",
        },
      }),
      prisma.riskAlert.findMany({
        where: {
          ...(scenicAreaId ? { scenicAreaId } : {}),
          isResolved: false,
        },
        select: { severity: true },
      }),
      prisma.guideRoute.findMany({
        where: scenicAreaId ? { scenicAreaId } : undefined,
        include: {
          scenicArea: { select: { id: true, name: true } },
          stops: true,
          riskAlerts: {
            where: { isResolved: false },
          },
        },
      }),
    ]);

    const effectiveAreaId = scenicAreaId ?? (routes[0]?.scenicAreaId);

    let cleanedOrders = [] as Awaited<ReturnType<typeof getCleanedOrders>>;
    let caliberData: Awaited<ReturnType<typeof getCaliberMatchedData>> = [];

    if (effectiveAreaId) {
      [cleanedOrders, caliberData] = await Promise.all([
        getCleanedOrders(effectiveAreaId),
        getCaliberMatchedData(effectiveAreaId),
      ]);
    }

    const todayCleanedOrders = cleanedOrders.filter(
      (o) => new Date(o.visitDate) >= todayStart && o.status !== "CANCELLED"
    );

    const totalVisitors = todayCleanedOrders.reduce(
      (sum, order) => sum + order.visitorCount,
      0
    );
    const totalRevenue = todayCleanedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const cameraVisitorByStop = new Map<string, number>();
    const cameraCongestionByStop = new Map<string, string>();
    for (const record of caliberData) {
      const stopId = record.cameraStatistic.stopId;
      const existing = cameraVisitorByStop.get(stopId) ?? 0;
      if (record.visitorCount > existing) {
        cameraVisitorByStop.set(stopId, record.visitorCount);
        cameraCongestionByStop.set(stopId, record.cameraStatistic.congestionLevel);
      }
    }

    const alertsBySeverity = activeAlerts.reduce(
      (acc: Record<string, number>, alert: { severity: string }) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const routeRiskSummaries = routes.map((route) => {
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
        currentVisitors,
        capacityUtilization:
          totalCapacity > 0 ? currentVisitors / totalCapacity : 0,
        alertCount,
        criticalAlertCount,
        riskLevel,
      };
    });

    return NextResponse.json({
      totalVisitors,
      totalRevenue,
      activeAlertsCount: activeAlerts.length,
      alertsBySeverity,
      routeRiskSummaries,
      cancelledPerformanceCount: cancelledPerformances,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
