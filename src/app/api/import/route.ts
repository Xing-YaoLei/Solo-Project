import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  mergePaymentRecords,
  mergeDesignExports,
  associatePhotos,
} from "@/lib/data-processor";
import type { PaymentRecord, DesignExportRecord, PhotoRecord } from "@/lib/data-processor";
import { getPublicUrl, uploadToSupabase } from "@/lib/supabase";
import { mockImportBatches } from "@/lib/mock-data";

interface ImportResult {
  mergedCount: number;
  newEntries: number;
  updatedEntries: number;
  importBatchId: string;
  batchNo?: string;
  warnings: string[];
}

function generateBatchNo(prefix: string): string {
  return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
}

function isMock(request: Request, bodyMock?: unknown): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("mock") === "true" || bodyMock === true;
}

function buildMockResult(source: string, count: number): ImportResult {
  const prefix =
    source === "PAYMENT"
      ? "PAY"
      : source === "DESIGN_EXPORT"
        ? "DES"
        : "PHO";
  return {
    mergedCount: count,
    newEntries: count,
    updatedEntries: 0,
    importBatchId: `mock-ib-${Date.now()}`,
    batchNo: generateBatchNo(prefix),
    warnings: [],
  };
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const contentType = request.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      return await handleJsonImport(request, user);
    }

    return await handleFormDataImport(request, user);
  } catch (error) {
    console.error("数据导入失败:", error);
    return NextResponse.json(
      { error: "数据导入失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleJsonImport(
  request: Request,
  user: ReturnType<typeof getCurrentUser>
) {
  const body = await request.json();
  const { source, records, importBatchId, mock: bodyMock } = body as {
    source?: string;
    records?: PaymentRecord[] | DesignExportRecord[];
    importBatchId?: string;
    mock?: boolean;
  };

  if (!source) {
    return NextResponse.json(
      { error: "缺少导入来源参数" },
      { status: 400 }
    );
  }

  if (!records || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      { error: "缺少导入记录数据" },
      { status: 400 }
    );
  }

  const mockMode = isMock(request, bodyMock);

  switch (source) {
    case "PAYMENT": {
      if (mockMode) {
        return NextResponse.json(buildMockResult("PAYMENT", records.length));
      }
      const result = await mergePaymentRecords(
        records as PaymentRecord[],
        user.userId
      );
      const batch = await prisma.importBatch.findUnique({
        where: { id: result.importBatchId },
        select: { batchNo: true },
      });
      return NextResponse.json({ ...result, batchNo: batch?.batchNo });
    }

    case "DESIGN_EXPORT": {
      if (mockMode) {
        return NextResponse.json(buildMockResult("DESIGN_EXPORT", records.length));
      }
      const result = await mergeDesignExports(
        records as DesignExportRecord[],
        user.userId,
        importBatchId || undefined
      );
      const batch = await prisma.importBatch.findUnique({
        where: { id: result.importBatchId },
        select: { batchNo: true },
      });
      return NextResponse.json({ ...result, batchNo: batch?.batchNo });
    }

    default:
      return NextResponse.json(
        { error: "不支持的导入来源" },
        { status: 400 }
      );
  }
}

async function handleFormDataImport(
  request: Request,
  user: ReturnType<typeof getCurrentUser>
) {
  const formData = await request.formData();
  const source = formData.get("source") as string;

  if (!source) {
    return NextResponse.json(
      { error: "缺少导入来源参数" },
      { status: 400 }
    );
  }

  if (source !== "PHOTO") {
    return NextResponse.json(
      { error: "FormData仅支持PHOTO导入，PAYMENT/DESIGN_EXPORT请使用JSON" },
      { status: 400 }
    );
  }

  const mockMode = isMock(request, formData.get("mock") === "true");

  const files = formData.getAll("files") as File[];
  const batchNos = formData.getAll("batchNos") as string[];
  const projectNames = formData.getAll("projectNames") as string[];
  const totalItems = Math.max(files.length, batchNos.length, 1);

  if (mockMode) {
    return NextResponse.json(buildMockResult("PHOTO", totalItems));
  }

  if (files.length === 0) {
    const batchNo = generateBatchNo("PHO");
    const importBatch = await prisma.importBatch.create({
      data: {
        batchNo,
        source: "PHOTO",
        importedBy: user.userId,
        recordCount: batchNos.length,
      },
    });
    return NextResponse.json({
      mergedCount: batchNos.length,
      newEntries: 0,
      updatedEntries: 0,
      importBatchId: importBatch.id,
      batchNo,
      warnings: [],
    });
  }

  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "material-photos";
  const photoRecords: PhotoRecord[] = [];

  for (let i = 0; i < files.length; i++) {
    const photoFile = files[i];
    const batchNo = batchNos[i] || "";
    const projectName = projectNames[i] || "";
    const filePath = `${user.userId}/${Date.now()}-${i}/${photoFile.name}`;

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

  const result = await associatePhotos(photoRecords, user.userId);
  const batch = await prisma.importBatch.findUnique({
    where: { id: result.importBatchId },
    select: { batchNo: true },
  });

  return NextResponse.json({ ...result, batchNo: batch?.batchNo });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const isMock = searchParams.get("mock") === "true";

    if (isMock) {
      let filtered = [...mockImportBatches];
      if (source) {
        filtered = filtered.filter((b) => b.source === source);
      }
      const start = (page - 1) * pageSize;
      const paginatedData = filtered.slice(start, start + pageSize);
      return NextResponse.json({
        data: paginatedData,
        total: filtered.length,
        page,
        pageSize,
      });
    }

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
        projectNames: Array.from(
          new Set(
            batch.batches.map((b) => b.project?.name).filter(Boolean)
          )
        ),
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
