import { NextRequest, NextResponse } from "next/server";
import { getImportBatches } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json();
    const batch = {
      id: "b" + Date.now(),
      source: body.source,
      status: "processing" as const,
      totalRecords: 0,
      successCount: 0,
      errorCount: 0,
      fileName: body.fileName,
      importedBy: body.importedBy || "u1",
      importedByName: "系统管理员",
      importedAt: new Date().toISOString(),
    };
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "创建导入批次失败" },
      { status: 500 }
    );
  }
}
