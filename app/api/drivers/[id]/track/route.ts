import { NextResponse } from "next/server";
import { generateTrackPoints } from "@/lib/mockData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const track = generateTrackPoints(30);

    return NextResponse.json({
      success: true,
      data: {
        driverId: id,
        trackPoints: track,
        stats: {
          totalPoints: track.length,
          avgSpeed:
            track.length > 0
              ? parseFloat(
                  (track.reduce((sum, p) => sum + p.speed, 0) / track.length).toFixed(1)
                )
              : 0,
          orderStops: track.filter((p) => p.orderId).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取司机轨迹数据失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
