import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = request.headers.get("x-user-role") as any;
  const userId = request.headers.get("x-user-id");

  const check = requireRole(role, ["admin", "manager", "staff"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    const { getFollowUpDetail } = require("@/lib/data-store");
    const detail = getFollowUpDetail(params.id);
    if (!detail) {
      return NextResponse.json({ error: "回访记录不存在" }, { status: 404 });
    }
    if (role === "staff" && detail.followUp.assigneeId !== userId) {
      return NextResponse.json(
        { error: "无权查看他人负责的回访记录" },
        { status: 403 }
      );
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: "获取回访详情失败" },
      { status: 500 }
    );
  }
}
