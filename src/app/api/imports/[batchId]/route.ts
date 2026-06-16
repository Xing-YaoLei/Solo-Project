import { NextRequest, NextResponse } from "next/server";
import { getImportBatchDetail } from "@/lib/mock-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const detail = getImportBatchDetail(params.batchId);
    if (!detail) {
      return NextResponse.json({ error: "批次不存在" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: "获取批次详情失败" },
      { status: 500 }
    );
  }
}
