import { NextRequest, NextResponse } from "next/server";
import { getFollowUpDetail, addAnnotation } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const detail = getFollowUpDetail(params.id);
    if (!detail) {
      return NextResponse.json({ error: "回访记录不存在" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: "获取回访详情失败" },
      { status: 500 }
    );
  }
}
