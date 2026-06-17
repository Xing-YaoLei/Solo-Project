import { NextResponse } from "next/server";
import { getDriverCheckins } from "@/lib/unifiedData";

export async function GET() {
  try {
    const result = getDriverCheckins();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取司机签到状态失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
