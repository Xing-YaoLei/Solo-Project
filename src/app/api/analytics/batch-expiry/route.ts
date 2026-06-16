import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role") as any;
  const check = requireRole(role, ["admin", "manager"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const { getBatchExpiryData } = require("@/lib/data-store");
    return NextResponse.json(getBatchExpiryData());
  } catch (error) {
    return NextResponse.json(
      { error: "获取批号效期数据失败" },
      { status: 500 }
    );
  }
}
