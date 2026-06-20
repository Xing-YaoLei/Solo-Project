import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
            cameraStatistics: {
              orderBy: { recordedAt: "desc" },
              take: 10,
            },
            merchantTransactions: {
              orderBy: { transactionTime: "desc" },
              take: 20,
            },
            performances: {
              where: { status: { in: ["SCHEDULED", "CANCELLED"] } },
              orderBy: { scheduledTime: "desc" },
            },
          },
          orderBy: { stopOrder: "asc" },
        },
        orders: {
          orderBy: { orderTime: "desc" },
          take: 50,
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

    const stopCongestionData = route.stops.map(
      (stop: typeof route.stops[number]) => {
        const latestStat = stop.cameraStatistics[0];
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

    return NextResponse.json({
      ...route,
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
