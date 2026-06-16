import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role") as any;
  const check = requireRole(role, ["admin"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get("source") || undefined;
    const status = searchParams.get("status") || undefined;
    const { getImportBatches } = require("@/lib/data-store");
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
  const role = request.headers.get("x-user-role") as any;
  const userId = request.headers.get("x-user-id");
  const check = requireRole(role, ["admin"]);
  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }
  try {
    const body = await request.json();
    const { createImportBatch, processImportBatch } = require("@/lib/data-store");
    const batch = createImportBatch(
      body.source,
      body.fileName,
      userId || "u1",
      body.rows || generateSampleRows(body.source, body.recordCount || 20)
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

function generateSampleRows(source: string, count: number) {
  const names = ["赵明", "钱华", "孙丽", "李军", "周敏", "吴强", "郑芳", "王磊"];
  const drugs = ["苯磺酸氨氯地平片", "盐酸二甲双胍缓释片", "阿托伐他汀钙片", "阿司匹林肠溶片"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] + (i >= names.length ? i : "");
    if (source === "pos") {
      rows.push({
        row: i + 1,
        memberName: name,
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        drugName: drugs[i % drugs.length],
        drugSku: `DRUG${String((i % 10) + 1).padStart(3, "0")}`,
        quantity: 1 + (i % 3),
        unitPrice: 25 + i * 3.5,
        purchaseDate: `2025-06-${String((i % 28) + 1).padStart(2, "0")}`,
        expiryDays: 10 + (i % 100),
        batchNo: `B2025${String(i + 1).padStart(4, "0")}`,
        insuranceAmount: i % 2 === 0 ? 100 + i * 10 : undefined,
        storeId: "s1",
      });
    } else if (source === "member") {
      rows.push({
        row: i + 1,
        name,
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        age: 50 + (i % 30),
        gender: i % 2 === 0 ? "男" : "女",
        riskLevel: i % 5 === 0 ? "high" : i % 3 === 0 ? "medium" : "low",
        chronicTypes: i % 2 === 0 ? ["高血压"] : ["糖尿病"],
        storeId: "s1",
      });
    } else if (source === "inventory") {
      rows.push({
        row: i + 1,
        drugName: drugs[i % drugs.length],
        batchNo: `B2025${String(i + 1).padStart(4, "0")}`,
        expiryDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
        quantity: 50 + i * 20,
        storeId: "s1",
      });
    } else {
      rows.push({
        row: i + 1,
        memberName: name,
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        amount: 80 + i * 25.5,
        count: 1 + (i % 3),
        transactionDate: `2025-${String((i % 6) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
        storeId: "s1",
      });
    }
  }
  return rows;
}
