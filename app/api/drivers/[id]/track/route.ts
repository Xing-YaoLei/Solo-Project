import { NextResponse } from "next/server";
import { getDriverTrack } from "@/lib/unifiedData";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("routeId") ?? undefined;

    const result = getDriverTrack(id, routeId);

    return NextResponse.json({
      success: true,
      data: result,
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
