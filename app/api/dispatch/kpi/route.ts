import { NextResponse } from "next/server";
import { getKPIData } from "@/lib/unifiedData";

export async function GET() {
  try {
    const data = getKPIData();
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
