import { prisma } from "../prisma";
import { processReceipts, parseReceiptCSV, ReceiptRecord } from "./receipt";
import { processInventory, parseInventoryCSV, InventoryRecord } from "./inventory";
import { processPos, parsePosCSV, PosRecord } from "./pos";

export type SourceType = "receipt" | "inventory" | "pos";

export async function createBatch(
  sourceType: SourceType,
  fileName: string,
  storeId?: string
): Promise<string> {
  const batch = await prisma.importBatch.create({
    data: {
      sourceType,
      fileName,
      storeId,
      status: "pending",
    },
  });
  return batch.id;
}

export async function processBatch(
  batchId: string,
  sourceType: SourceType,
  csvContent: string,
  storeId?: string
): Promise<void> {
  await prisma.importBatch.update({
    where: { id: batchId },
    data: { status: "processing" },
  });

  let result: { success: number; errors: string[] };
  let totalRecords = 0;

  try {
    switch (sourceType) {
      case "receipt": {
        const records = parseReceiptCSV(csvContent) as ReceiptRecord[];
        totalRecords = records.length;
        await prisma.importRecord.createMany({
          data: records.map((r) => ({
            batchId,
            recordType: "receipt",
            rawData: JSON.stringify(r.rawData),
          })),
        });
        result = await processReceipts(records, batchId, storeId);
        break;
      }
      case "inventory": {
        const records = parseInventoryCSV(csvContent) as InventoryRecord[];
        totalRecords = records.length;
        await prisma.importRecord.createMany({
          data: records.map((r) => ({
            batchId,
            recordType: "inventory",
            rawData: JSON.stringify(r.rawData),
          })),
        });
        result = await processInventory(records, batchId, storeId);
        break;
      }
      case "pos": {
        const records = parsePosCSV(csvContent) as PosRecord[];
        totalRecords = records.length;
        await prisma.importRecord.createMany({
          data: records.map((r) => ({
            batchId,
            recordType: "pos",
            rawData: JSON.stringify(r.rawData),
          })),
        });
        result = await processPos(records, batchId, storeId);
        break;
      }
    }

    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: result.errors.length === 0 ? "completed" : "completed",
        totalRecords,
        successCount: result.success,
        errorCount: result.errors.length,
        errorLog: result.errors.length > 0 ? result.errors.join("\n") : null,
        processedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: "failed",
        errorLog: (e as Error).message,
        processedAt: new Date(),
      },
    });
    throw e;
  }
}
