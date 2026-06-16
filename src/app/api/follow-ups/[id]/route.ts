import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseRoleFromHeader, parseUserIdFromHeader } from "@/lib/auth-guard";
import { getFollowUpDetail } from "@/lib/server-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const role = parseRoleFromHeader(request.headers);
  const userId = parseUserIdFromHeader(request.headers);

  const check = requireRole(role, ["admin", "manager", "staff"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
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
