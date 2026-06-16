import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role") as any;
  const check = requireRole(role, ["admin", "manager"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const { getDashboardOverview } = require("@/lib/data-store");
    const data = getDashboardOverview();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "获取仪表盘数据失败" },
      { status: 500 }
    );
  }
}
