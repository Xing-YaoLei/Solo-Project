import { NextResponse } from "next/server";
import { generateKPI } from "@/lib/mockData";

export async function GET() {
  try {
    const data = generateKPI();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "获取KPI数据失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
