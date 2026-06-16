import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/lib/mock-data";

export async function GET() {
  try {
    const data = getDashboardOverview();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取仪表盘数据失败" },
      { status: 500 }
    );
  }
}
