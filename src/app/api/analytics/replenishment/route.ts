import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role") as any;
  const check = requireRole(role, ["admin", "manager"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit")) || 10;
    const { getReplenishmentRanking } = require("@/lib/data-store");
    return NextResponse.json(getReplenishmentRanking(limit));
  } catch (error) {
    return NextResponse.json(
      { error: "获取补货排行数据失败" },
      { status: 500 }
    );
  }
}
