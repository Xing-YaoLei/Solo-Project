import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const role = request.headers.get("x-user-role") as any;
  const check = requireRole(role, ["admin"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const { getImportBatchDetail } = require("@/lib/data-store");
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
