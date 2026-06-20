import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getCleanedOrdersForRoute,
  getCleanedCameraStats,
  getCleanedTransactionsForStop,
} from "@/lib/cleaned-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const route = await prisma.guideRoute.findUnique({
      where: { id },
      include: {
        scenicArea: { select: { id: true, name: true } },
        stops: {
          include: {
            performances: {
              where: { status: { in: ["SCHEDULED", "CANCELLED"] } },
              orderBy: { scheduledTime: "desc" },
            },
          },
          orderBy: { stopOrder: "asc" },
        },
        riskAlerts: {
          where: { isResolved: false },
          orderBy: { detectedAt: "desc" },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const scenicAreaId = route.scenicAreaId;

    const [cleanedOrders, cleanedCameraStats] = await Promise.all([
      getCleanedOrdersForRoute(scenicAreaId, id),
      getCleanedCameraStats(scenicAreaId),
    ]);

    const routeStopIds = new Set(route.stops.map((s) => s.id));
    const routeCameraStats = cleanedCameraStats.filter((cs) =>
      routeStopIds.has(cs.stopId)
    );

    const cameraByStop = new Map<string, typeof routeCameraStats>();
    for (const cs of routeCameraStats) {
      const existing = cameraByStop.get(cs.stopId) ?? [];
      existing.push(cs);
      cameraByStop.set(cs.stopId, existing);
    }

    const cleanedTransactionsByStop = new Map<string, Awaited<ReturnType<typeof getCleanedTransactionsForStop>>>();
    const txPromises = route.stops.map(async (stop) => {
      const txs = await getCleanedTransactionsForStop(stop.id);
      cleanedTransactionsByStop.set(stop.id, txs);
    });
    await Promise.all(txPromises);

    const stopCongestionData = route.stops.map(
      (stop: typeof route.stops[number]) => {
        const stats = cameraByStop.get(stop.id) ?? [];
        const latestStat = stats.length > 0
          ? stats.reduce((a, b) => (new Date(a.recordedAt) > new Date(b.recordedAt) ? a : b))
          : null;
        return {
          stopName: stop.name,
          visitorCount: latestStat?.visitorCount ?? 0,
          capacity: stop.capacity,
          utilization:
            stop.capacity > 0
              ? (latestStat?.visitorCount ?? 0) / stop.capacity
              : 0,
          congestionLevel: latestStat?.congestionLevel ?? "LOW",
          avgStayMinutes: latestStat?.avgStayMinutes ?? 0,
        };
      }
    );

    const currentVisitors = stopCongestionData.reduce(
      (sum, d) => sum + d.visitorCount,
      0
    );

    const totalCapacity = route.stops.reduce(
      (sum: number, stop: typeof route.stops[number]) => sum + stop.capacity,
      0
    );

    const stopsData = route.stops.map((stop: typeof route.stops[number]) => {
      const stats = cameraByStop.get(stop.id) ?? [];
      const txs = cleanedTransactionsByStop.get(stop.id) ?? [];
      return {
        ...stop,
        cameraStatistics: stats.slice(0, 10),
        merchantTransactions: txs.slice(0, 20),
      };
    });

    return NextResponse.json({
      ...route,
      stops: stopsData,
      orders: cleanedOrders.slice(0, 50),
      currentVisitors,
      totalCapacity,
      capacityUtilization: totalCapacity > 0 ? currentVisitors / totalCapacity : 0,
      stopCongestionData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch route detail" },
      { status: 500 }
    );
  }
}
