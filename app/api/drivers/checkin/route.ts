import { NextResponse } from "next/server";
import { generateDriverCheckins } from "@/lib/mockData";

export async function GET() {
  try {
    const checkins = generateDriverCheckins(10);

    return NextResponse.json({
      success: true,
      data: {
        list: checkins,
        stats: {
          totalDrivers: checkins.length,
          checkedIn: checkins.filter((c) => c.status === "checked_in").length,
          notCheckedIn: checkins.filter((c) => c.status === "not_checked_in").length,
          abnormal: checkins.filter((c) => c.status === "abnormal").length,
        },
      },
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
