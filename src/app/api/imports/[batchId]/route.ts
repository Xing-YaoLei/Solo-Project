import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseRoleFromHeader } from "@/lib/auth-guard";
import { getImportBatchDetail } from "@/lib/server-data";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  const role = parseRoleFromHeader(request.headers);
  const check = requireRole(role, ["admin"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
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
