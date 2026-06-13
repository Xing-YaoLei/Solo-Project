import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, canAccessStore } from "@/lib/permissions";
import { createBatch, processBatch, SourceType } from "@/lib/data-processing/batch";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sourceType = formData.get("sourceType") as SourceType | null;
    const storeId = formData.get("storeId") as string | null;

    if (!file || !sourceType || !storeId) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    if (!["receipt", "inventory", "pos"].includes(sourceType)) {
      return NextResponse.json({ error: "无效的导入类型" }, { status: 400 });
    }

    if (!canAccessStore(user, storeId)) {
      return NextResponse.json({ error: "无权限访问该门店" }, { status: 403 });
    }

    const csvContent = await file.text();
    const batchId = await createBatch(sourceType, file.name, storeId);

    processBatch(batchId, sourceType, csvContent, storeId).catch((e) => {
      console.error("Batch processing error:", e);
    });

    return NextResponse.json({ batchId });
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
