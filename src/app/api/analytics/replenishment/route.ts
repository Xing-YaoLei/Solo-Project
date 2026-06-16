import { NextRequest, NextResponse } from "next/server";
import { getReplenishmentRanking } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit")) || 10;
    const data = getReplenishmentRanking(limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取补货排行数据失败" },
      { status: 500 }
    );
  }
}
