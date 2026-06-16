import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseRoleFromHeader } from "@/lib/auth-guard";
import { getDashboardOverview } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const role = parseRoleFromHeader(request.headers);
  const check = requireRole(role, ["admin", "manager"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
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
