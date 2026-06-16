import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseRoleFromHeader } from "@/lib/auth-guard";
import { getInsuranceTrend } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const role = parseRoleFromHeader(request.headers);
  const check = requireRole(role, ["admin", "manager"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthsParam = searchParams.get("months");
    const months = monthsParam ? Number(monthsParam) : undefined;
    const data = getInsuranceTrend(months);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取医保流水数据失败" },
      { status: 500 }
    );
  }
}
