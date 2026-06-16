import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role") as any;
  const userId = request.headers.get("x-user-id");

  const check = requireRole(role, ["admin", "manager", "staff"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const { getFollowUpsByAssignee } = require("@/lib/data-store");
    const assigneeId = role === "staff" ? userId || null : null;
    const items = getFollowUpsByAssignee(assigneeId);
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: "获取回访列表失败" },
      { status: 500 }
    );
  }
}
