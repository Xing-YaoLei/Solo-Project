import { NextRequest, NextResponse } from "next/server";
import { getInsuranceTrend } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const months = Number(searchParams.get("months")) || 6;
    const data = getInsuranceTrend(months);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取医保流水数据失败" },
      { status: 500 }
    );
  }
}
