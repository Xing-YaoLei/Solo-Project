import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { PerformanceStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PerformanceStatus | null;
    const scenicAreaId = searchParams.get("scenicAreaId");

    if (status === "CANCELLED") {
      const performances = await prisma.performance.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(scenicAreaId ? { scenicAreaId } : {}),
        },
        include: {
          stop: {
            select: {
              id: true,
              name: true,
              type: true,
              routeId: true,
              route: {
                select: {
                  id: true,
                  name: true,
                  riskAlerts: {
                    where: { isResolved: false },
                    orderBy: { detectedAt: "desc" },
                    take: 5,
                  },
                },
              },
            },
          },
          reviewMaterials: true,
        },
        orderBy: { scheduledTime: "desc" },
      });

      return NextResponse.json(performances);
    }

    const performances = await prisma.performance.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(scenicAreaId ? { scenicAreaId } : {}),
      },
      include: {
        stop: {
          select: { id: true, name: true, type: true, routeId: true },
        },
      },
      orderBy: { scheduledTime: "desc" },
    });

    return NextResponse.json(performances);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch performances" },
      { status: 500 }
    );
  }
}
