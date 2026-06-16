import { NextRequest, NextResponse } from "next/server";
import { requireRole, parseRoleFromHeader, parseUserIdFromHeader } from "@/lib/auth-guard";
import {
  getImportBatches,
  createImportBatch,
  processImportBatch,
  generateSampleRows,
} from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const role = parseRoleFromHeader(request.headers);
  const check = requireRole(role, ["admin"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source") || undefined;
    const status = searchParams.get("status") || undefined;
    const items = getImportBatches({ source, status });
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: "获取导入批次失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const role = parseRoleFromHeader(request.headers);
  const userId = parseUserIdFromHeader(request.headers);
  const check = requireRole(role, ["admin"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const body = await request.json();
    const rows = body.rows || generateSampleRows(body.source, body.recordCount || 20);
    const batch = createImportBatch(
      body.source,
      body.fileName || `${body.source}_import_${Date.now()}.csv`,
      userId || "u1",
      rows
    );
    const processed = processImportBatch(batch.id);
    return NextResponse.json(processed, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "创建导入批次失败: " + error.message },
      { status: 500 }
    );
  }
}
