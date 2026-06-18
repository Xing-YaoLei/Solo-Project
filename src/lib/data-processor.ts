import { prisma } from "./prisma";
import type { MaterialEntry, Batch, ImportBatch } from "@prisma/client";

export interface PaymentRecord {
  id?: string;
  materialName: string;
  category: string;
  specification?: string;
  quantity: number;
  unit: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  projectName: string;
}

export interface DesignExportRecord {
  id?: string;
  materialName: string;
  category: string;
  specification?: string;
  quantity: number;
  unit: string;
  projectName: string;
}

export interface PhotoRecord {
  id?: string;
  batchNo: string;
  photoUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  projectName: string;
}

export interface MergeResult {
  mergedCount: number;
  newEntries: number;
  updatedEntries: number;
  importBatchId: string;
  warnings: string[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  瓷砖: ["砖", "瓷砖", "地砖", "墙砖", "抛光砖", "抛釉砖"],
  涂料: ["漆", "涂料", "乳胶漆", "真石漆", "底漆", "防水"],
  管材: ["管", "水管", "线管", "PPR", "PVC", "地暖"],
  五金: ["锁", "合页", "角阀", "龙头", "五金", "螺丝"],
  电线: ["线", "电线", "电缆", "网线", "BV线"],
  木材: ["板", "木", "地板", "木工板", "密度板", "生态板"],
  玻璃: ["玻璃", "钢化", "中空", "磨砂", "夹胶"],
  防水材料: ["防水", "卷材", "堵漏", "聚氨酯", "JS"],
};

export function detectCategory(materialName: string): string {
  const name = materialName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return "其他";
}

export function parsePaymentRecord(content: string): PaymentRecord[] {
  const records: PaymentRecord[] = [];

  try {
    const lines = content.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(/[,\t|]/).map((h) => h.trim());

    const nameIdx = headers.findIndex((h) =>
      h.includes("材料") || h.includes("名称") || h.includes("品名")
    );
    const qtyIdx = headers.findIndex((h) =>
      h.includes("数量") || h.includes("件数")
    );
    const unitIdx = headers.findIndex((h) => h.includes("单位"));
    const supplierIdx = headers.findIndex((h) =>
      h.includes("供应商") || h.includes("厂家")
    );
    const amountIdx = headers.findIndex((h) =>
      h.includes("金额") || h.includes("总价")
    );
    const dateIdx = headers.findIndex((h) =>
      h.includes("日期") || h.includes("时间")
    );
    const projectIdx = headers.findIndex((h) =>
      h.includes("项目") || h.includes("工地")
    );
    const specIdx = headers.findIndex((h) =>
      h.includes("规格") || h.includes("型号")
    );

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,\t|]/).map((v) => v.trim());
      if (values.length < 3) continue;

      const materialName = values[nameIdx] || values[0];
      const quantity = parseFloat(values[qtyIdx] || values[2]) || 0;
      const unit = values[unitIdx] || values[3] || "件";
      const supplierName = values[supplierIdx] || values[4] || "未知供应商";
      const amount = parseFloat(values[amountIdx] || values[5]) || 0;
      const paymentDate = values[dateIdx] || values[6] || new Date().toISOString().split("T")[0];
      const projectName = values[projectIdx] || values[7] || "默认项目";
      const specification = values[specIdx] || undefined;

      if (!materialName || quantity <= 0) continue;

      records.push({
        materialName,
        category: detectCategory(materialName),
        specification,
        quantity,
        unit,
        supplierName,
        amount,
        paymentDate,
        projectName,
      });
    }
  } catch (e) {
    console.error("解析收款记录失败:", e);
    throw new Error("收款记录格式解析失败");
  }

  return records;
}

export function parseDesignExport(content: string): DesignExportRecord[] {
  const records: DesignExportRecord[] = [];

  try {
    const lines = content.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(/[,\t|]/).map((h) => h.trim());

    const nameIdx = headers.findIndex((h) =>
      h.includes("材料") || h.includes("名称")
    );
    const qtyIdx = headers.findIndex((h) => h.includes("数量"));
    const unitIdx = headers.findIndex((h) => h.includes("单位"));
    const projectIdx = headers.findIndex((h) =>
      h.includes("项目") || h.includes("空间")
    );
    const specIdx = headers.findIndex((h) =>
      h.includes("规格") || h.includes("型号")
    );

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,\t|]/).map((v) => v.trim());
      if (values.length < 3) continue;

      const materialName = values[nameIdx] || values[0];
      const quantity = parseFloat(values[qtyIdx] || values[2]) || 0;
      const unit = values[unitIdx] || values[3] || "件";
      const projectName = values[projectIdx] || values[4] || "默认项目";
      const specification = values[specIdx] || undefined;

      if (!materialName || quantity <= 0) continue;

      records.push({
        materialName,
        category: detectCategory(materialName),
        specification,
        quantity,
        unit,
        projectName,
      });
    }
  } catch (e) {
    console.error("解析设计导出失败:", e);
    throw new Error("设计导出格式解析失败");
  }

  return records;
}

function calculateSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[\s\-_/\\]/g, "");
  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  let matches = 0;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length >= nb.length ? na : nb;

  for (const char of shorter) {
    if (longer.includes(char)) matches++;
  }

  return matches / longer.length;
}

export async function mergePaymentRecords(
  paymentRecords: PaymentRecord[],
  importedBy: string
): Promise<MergeResult> {
  const warnings: string[] = [];
  let newEntries = 0;
  let updatedEntries = 0;

  const batchNo = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const importBatch = await prisma.importBatch.create({
    data: {
      batchNo,
      source: "PAYMENT",
      importedBy,
      recordCount: paymentRecords.length,
    },
  });

  for (const record of paymentRecords) {
    let project = await prisma.project.findFirst({
      where: { name: record.projectName },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: record.projectName },
      });
    }

    let supplier = await prisma.supplier.findFirst({
      where: { name: record.supplierName },
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { name: record.supplierName },
      });
    }

    const existingEntry = await prisma.materialEntry.findFirst({
      where: {
        materialName: record.materialName,
        supplierId: supplier.id,
        entryDate: new Date(record.paymentDate),
      },
    });

    if (existingEntry) {
      await prisma.materialEntry.update({
        where: { id: existingEntry.id },
        data: {
          quantity: existingEntry.quantity + record.quantity,
        },
      });
      updatedEntries++;
      continue;
    }

    const batch = await prisma.batch.create({
      data: {
        batchNo: `${batchNo}-${String(newEntries + 1).padStart(3, "0")}`,
        importSource: "PAYMENT",
        importBatchId: importBatch.id,
        projectId: project.id,
        status: "COMPLETE",
      },
    });

    await prisma.materialEntry.create({
      data: {
        batchId: batch.id,
        materialName: record.materialName,
        category: record.category,
        specification: record.specification,
        quantity: record.quantity,
        unit: record.unit,
        supplierId: supplier.id,
        entryDate: new Date(record.paymentDate),
        status: "ARRIVED",
      },
    });

    newEntries++;
  }

  return {
    mergedCount: paymentRecords.length,
    newEntries,
    updatedEntries,
    importBatchId: importBatch.id,
    warnings,
  };
}

export async function mergeDesignExports(
  designRecords: DesignExportRecord[],
  importedBy: string,
  existingImportBatchId?: string
): Promise<MergeResult> {
  const warnings: string[] = [];
  let newEntries = 0;
  let updatedEntries = 0;

  let importBatchId = existingImportBatchId;

  if (!importBatchId) {
    const batchNo = `DES-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const importBatch = await prisma.importBatch.create({
      data: {
        batchNo,
        source: "DESIGN_EXPORT",
        importedBy,
        recordCount: designRecords.length,
      },
    });
    importBatchId = importBatch.id;
  }

  for (const record of designRecords) {
    let project = await prisma.project.findFirst({
      where: { name: record.projectName },
    });

    if (!project) {
      project = await prisma.project.create({
        data: { name: record.projectName },
      });
    }

    const existingEntries = await prisma.materialEntry.findMany({
      where: {
        category: record.category,
        batch: { projectId: project.id },
      },
      include: { supplier: true },
    });

    let matched = false;
    let bestMatch: { entry: typeof existingEntries[0]; score: number } | null = null;

    for (const entry of existingEntries) {
      const similarity = calculateSimilarity(
        entry.materialName,
        record.materialName
      );
      if (similarity > 0.7) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = { entry, score: similarity };
        }
      }
    }

    if (bestMatch) {
      await prisma.materialEntry.update({
        where: { id: bestMatch.entry.id },
        data: {
        specification: record.specification || bestMatch.entry.specification,
        },
      });
      updatedEntries++;
      matched = true;
      continue;
    }

    if (!matched) {
      warnings.push(
        `材料 ${record.materialName} 未找到匹配的收款记录，已创建新记录`
      );

      const batch = await prisma.batch.create({
        data: {
          batchNo: `MANUAL-${Date.now()}-${newEntries + 1}`,
          importSource: "DESIGN_EXPORT",
          importBatchId,
          projectId: project.id,
          status: "PARTIAL",
          notes: "设计导出材料，无对应收款记录",
        },
      });

      const defaultSupplier = await prisma.supplier.findFirst();

      await prisma.materialEntry.create({
        data: {
          batchId: batch.id,
          materialName: record.materialName,
          category: record.category,
          specification: record.specification,
          quantity: record.quantity,
          unit: record.unit,
          supplierId: defaultSupplier?.id || "",
          entryDate: new Date(),
          status: "ARRIVED",
        },
      });

      newEntries++;
    }
  }

  return {
    mergedCount: designRecords.length,
    newEntries,
    updatedEntries,
    importBatchId,
    warnings,
  };
}

export async function associatePhotos(
  photoRecords: PhotoRecord[],
  importedBy: string
): Promise<MergeResult> {
  const warnings: string[] = [];

  const batchNo = `PHO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const importBatch = await prisma.importBatch.create({
    data: {
      batchNo,
      source: "PHOTO",
      importedBy,
      recordCount: photoRecords.length,
    },
  });

  for (const photo of photoRecords) {
    const batch = await prisma.batch.findFirst({
      where: { batchNo: photo.batchNo },
    });

    if (batch) {
      await prisma.batch.update({
        where: { id: batch.id },
        data: {
          notes: batch.notes
            ? `${batch.notes}\n照片: ${photo.photoUrl}`
            : `照片: ${photo.photoUrl}`,
        },
      });
    } else {
      warnings.push(`批次 ${photo.batchNo} 不存在，照片已归档但未关联`);
    }
  }

  return {
    mergedCount: photoRecords.length,
    newEntries: 0,
    updatedEntries: photoRecords.length - warnings.length,
    importBatchId: importBatch.id,
    warnings,
  };
}

export async function calculateTurnoverDays(
  entryId: string
): Promise<number> {
  const entry = await prisma.materialEntry.findUnique({
    where: { id: entryId },
    include: {
      batch: true,
      requisitions: { orderBy: { requestedAt: "asc" } },
    },
  });

  if (!entry) return 0;

  if (entry.status === "RECLAIMED" && entry.requisitions.length > 0) {
    const firstRequisition = entry.requisitions[0];
    const entryDate = new Date(entry.entryDate);
    const requisitionDate = new Date(firstRequisition.requestedAt);
    const diffTime = Math.abs(requisitionDate.getTime() - entryDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const now = new Date();
  const entryDate = new Date(entry.entryDate);
  const diffTime = Math.abs(now.getTime() - entryDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function calculateKpiData(projectFilter?: string) {
  const where = projectFilter
    ? { batch: { projectId: projectFilter } }
    : {};

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyEntries = await prisma.materialEntry.findMany({
    where: {
      ...where,
      entryDate: { gte: monthStart },
    },
  });

  const inStockEntries = await prisma.materialEntry.findMany({
    where: {
      ...where,
      status: "IN_STOCK",
    },
  });

  const shortageBatches = await prisma.batch.findMany({
    where: {
      ...(projectFilter ? { projectId: projectFilter } : {}),
      status: "SHORTAGE",
    },
  });

  const allEntries = await prisma.materialEntry.findMany({
    where: {
      ...where,
      status: "RECLAIMED",
    },
    include: { requisitions: { orderBy: { requestedAt: "asc" }, take: 1 } },
  });

  let totalTurnover = 0;
  let reclaimedCount = 0;

  for (const entry of allEntries) {
    if (entry.requisitions.length > 0) {
      const entryDate = new Date(entry.entryDate);
      const reqDate = new Date(entry.requisitions[0].requestedAt);
      const diff = Math.ceil(
        (reqDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      totalTurnover += diff;
      reclaimedCount++;
    }
  }

  return {
    monthlyTotal: monthlyEntries.reduce((s, e) => s + e.quantity, 0),
    inStockTotal: inStockEntries.reduce((s, e) => s + e.quantity, 0),
    avgTurnoverDays: reclaimedCount > 0 ? totalTurnover / reclaimedCount : 0,
    shortageBatchCount: shortageBatches.length,
  };
}
