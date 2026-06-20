import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AlertSeverity } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenicAreaId = searchParams.get("scenicAreaId");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      cancelledPerformances,
      activeAlerts,
      routes,
    ] = await Promise.all([
      prisma.miniProgramOrder.findMany({
        where: {
          ...(scenicAreaId ? { scenicAreaId } : {}),
          visitDate: { gte: todayStart },
          status: { not: "CANCELLED" },
        },
      }),
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
          stops: {
            include: {
              cameraStatistics: {
                orderBy: { recordedAt: "desc" },
                take: 1,
              },
            },
          },
          riskAlerts: {
            where: { isResolved: false },
          },
        },
      }),
    ]);

    const totalVisitors = todayOrders.reduce(
      (sum: number, order: typeof todayOrders[number]) => sum + order.visitorCount,
      0
    );
    const totalRevenue = todayOrders.reduce(
      (sum: number, order: typeof todayOrders[number]) => sum + order.totalAmount,
      0
    );

    const alertsBySeverity = activeAlerts.reduce(
      (acc: Record<string, number>, alert: typeof activeAlerts[number]) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const routeRiskSummaries = routes.map((route) => {
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
