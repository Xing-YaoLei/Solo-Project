import Papa from "papaparse";

export interface InventoryRecord {
  sku: string;
  productName: string;
  quantity: number;
  costPrice: number;
  storeCode?: string;
  rawData: Record<string, unknown>;
}

export function parseInventoryCSV(content: string): InventoryRecord[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .filter((row) => row.sku || row["商品编码"])
    .map((row) => ({
      sku: row.sku || row["商品编码"] || "",
      productName: row.productname || row["商品名称"] || "",
      quantity: parseInt(row.quantity || row["数量"] || "0", 10),
      costPrice: parseFloat(row.costprice || row["成本价"] || "0"),
      storeCode: row.storecode || row["门店编码"],
      rawData: row as unknown as Record<string, unknown>,
    }));
}

export async function processInventory(
  records: InventoryRecord[],
  batchId: string,
  storeId?: string
): Promise<{ success: number; errors: string[] }> {
  const { prisma } = await import("@/lib/prisma");
  let success = 0;
  const errors: string[] = [];

  for (const record of records) {
    try {
      let invStoreId = storeId;
      if (!invStoreId && record.storeCode) {
        const store = await prisma.store.findUnique({ where: { code: record.storeCode } });
        invStoreId = store?.id;
      }
      if (!invStoreId) {
        errors.push(`库存缺少门店信息: ${JSON.stringify(record.rawData)}`);
        continue;
      }

      await prisma.inventory.create({
        data: {
          batchId,
          storeId: invStoreId,
          sku: record.sku,
          productName: record.productName,
          quantity: record.quantity,
          costPrice: record.costPrice,
        },
      });

      success++;
    } catch (e) {
      errors.push(`处理库存失败: ${(e as Error).message} - ${JSON.stringify(record.rawData)}`);
    }
  }

  return { success, errors };
}
