import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseRoleFromHeader, parseUserIdFromHeader } from "@/lib/auth-guard";
import { getFollowUpsByAssignee } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const role = parseRoleFromHeader(request.headers);
  const userId = parseUserIdFromHeader(request.headers);

  const check = requireRole(role, ["admin", "manager", "staff"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  if (role === "staff" && !userId) {
    return NextResponse.json(
      { error: "身份标识缺失，请重新登录" },
      { status: 401 }
    );
  }

  try {
    const assigneeId = role === "staff" ? userId! : null;
    const items = getFollowUpsByAssignee(assigneeId);
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: "获取回访列表失败" },
      { status: 500 }
    );
  }
}
