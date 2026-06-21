import { NextResponse } from "next/server";
import { SyncService } from "@/services/sync.service";
import { SyncSource, SyncStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") as SyncSource | null;
    const status = searchParams.get("status") as SyncStatus | null;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const [batches, stats] = await Promise.all([
      SyncService.getBatchList(
        source || undefined,
        status || undefined,
        limit
      ),
      SyncService.getBatchStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        batches,
        stats,
      },
    });
  } catch (error) {
    console.error("Failed to fetch sync batches:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
