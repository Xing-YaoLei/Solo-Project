import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncMerchantOrders } from "@/services/sync/merchantSync";
import { syncMiniappOrders } from "@/services/sync/miniappSync";
import { syncCameraStats } from "@/services/sync/cameraSync";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceType = searchParams.get("sourceType");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};
    if (sourceType) where.sourceType = sourceType;
    if (status) where.status = status;

    const [total, logs] = await Promise.all([
      prisma.syncLog.count({ where }),
      prisma.syncLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startTime: "desc" },
      }),
    ]);

    return NextResponse.json({
      total,
      list: logs.map((log) => ({
        id: log.id,
        sourceType: log.sourceType,
        startTime: log.startTime.toISOString(),
        endTime: log.endTime?.toISOString(),
        status: log.status,
        recordCount: log.recordCount,
        errorMessage: log.errorMessage,
      })),
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Sync logs API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sourceType } = await request.json();

    let result;
    switch (sourceType) {
      case "merchant":
        result = await syncMerchantOrders();
        break;
      case "miniapp":
        result = await syncMiniappOrders();
        break;
      case "camera":
        result = await syncCameraStats();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid source type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync trigger API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
