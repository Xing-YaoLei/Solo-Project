import { NextResponse } from "next/server";
import { SyncService } from "@/services/sync.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mapRecords } = body;

    if (!Array.isArray(mapRecords) || mapRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: "Map records array is required and must not be empty" },
        { status: 400 }
      );
    }

    const validRecords = mapRecords.map((record: any) => ({
      ...record,
      syncedAt: new Date(record.syncedAt),
    }));

    const result = await SyncService.syncMapRecords(validRecords);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to sync map records:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
