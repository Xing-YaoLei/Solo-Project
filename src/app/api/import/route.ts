import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  parsePaymentRecord,
  parseDesignExport,
  mergePaymentRecords,
  mergeDesignExports,
  associatePhotos,
} from "@/lib/data-processor";
import type { PaymentRecord, DesignExportRecord, PhotoRecord } from "@/lib/data-processor";
import { getPublicUrl, uploadToSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const user = getCurrentUser();

    const source = formData.get("source") as string;
    const file = formData.get("file") as File | null;
    const existingImportBatchId = formData.get("importBatchId") as string | null;

    if (!source) {
      return NextResponse.json(
      { error: "缺少导入来源参数" },
      { status: 400 }
    );
    }

    if (!file) {
      return NextResponse.json(
      { error: "缺少上传文件" },
      { status: 400 }
    );
    }

    const content = await file.text();

    let result;

    switch (source) {
      case "PAYMENT": {
      const records = parsePaymentRecord(content);
      result = await mergePaymentRecords(records, user.userId);
      break;
    }

      case "DESIGN_EXPORT": {
      const records = parseDesignExport(content);
      result = await mergeDesignExports(records, user.userId, existingImportBatchId || undefined);
      break;
    }

      case "PHOTO": {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "material-photos";
      const photoRecords: PhotoRecord[] = [];

      const files = formData.getAll("files") as File[];
      const batchNos = formData.getAll("batchNos") as string[];
      const projectNames = formData.getAll("projectNames") as string[];

      for (let i = 0; i < files.length; i++) {
        const photoFile = files[i];
        const batchNo = batchNos[i] || "";
        const projectName = projectNames[i] || "";

        const filePath = `${user.userId}/${Date.now()}/${photoFile.name}`;
        await uploadToSupabase(photoFile, bucket, filePath);
        const photoUrl = getPublicUrl(bucket, filePath);

        photoRecords.push({
          batchNo,
          photoUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.userId,
          projectName,
        });
      }

      result = await associatePhotos(photoRecords, user.userId);
      break;
    }

      default:
      return NextResponse.json(
        { error: "不支持的导入来源" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("数据导入失败:", error);
    return NextResponse.json(
      { error: "数据导入失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const user = getCurrentUser();

    const where: Record<string, unknown> = {};
    if (source) where.source = source;

    const [data, total] = await Promise.all([
      prisma.importBatch.findMany({
        where,
        include: { importer: true, batches: { include: { project: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { importedAt: "desc" },
      }),
      prisma.importBatch.count({ where }),
    ]);

    return NextResponse.json({
      data: data.map((batch) => ({
        id: batch.id,
        batchNo: batch.batchNo,
        source: batch.source,
        importedAt: batch.importedAt,
        importedBy: batch.importedBy,
        importerName: batch.importer?.name,
        recordCount: batch.recordCount,
        fileUrl: batch.fileUrl,
        projectNames: Array.from(new Set(batch.batches.map((b) => b.project?.name).filter(Boolean))),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取导入批次失败:", error);
    return NextResponse.json(
      { error: "获取导入批次失败" },
      { status: 500 }
    );
  }
}
