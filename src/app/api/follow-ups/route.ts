import { NextRequest, NextResponse } from "next/server";
import { getFollowUpsByAssignee } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assigneeId = searchParams.get("assigneeId") || null;

    const items = getFollowUpsByAssignee(assigneeId);
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: "获取回访列表失败" },
      { status: 500 }
    );
  }
}
