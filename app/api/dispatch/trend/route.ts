import { NextResponse } from "next/server";
import { generateDispatchTrend, generateAnomalyDistribution } from "@/lib/mockData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const trend = generateDispatchTrend(days);
    const anomalies = generateAnomalyDistribution();

    return NextResponse.json({
      success: true,
      data: {
        trend,
        anomalies,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取趋势数据失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
