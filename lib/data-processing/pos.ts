import Papa from "papaparse";

export interface PosRecord {
  transactionNo: string;
  memberNo?: string;
  storeCode?: string;
  type: string;
  amount: number;
  paymentMethod: string;
  transactionTime: string;
  rawData: Record<string, unknown>;
}

export function parsePosCSV(content: string): PosRecord[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .filter((row) => row.transactionno || row["交易号"])
    .map((row) => ({
      transactionNo: row.transactionno || row["交易号"] || "",
      memberNo: row.memberno || row["会员号"],
      storeCode: row.storecode || row["门店编码"],
      type: row.type || row["类型"] || "consume",
      amount: parseFloat(row.amount || row["金额"] || "0"),
      paymentMethod: row.paymentmethod || row["支付方式"] || "cash",
      transactionTime: row.transactiontime || row["交易时间"] || new Date().toISOString(),
      rawData: row as unknown as Record<string, unknown>,
    }));
}

export async function processPos(
  records: PosRecord[],
  batchId: string,
  storeId?: string
): Promise<{ success: number; errors: string[] }> {
  const { prisma } = await import("@/lib/prisma");
  let success = 0;
  const errors: string[] = [];

  for (const record of records) {
    try {
      let posStoreId = storeId;
      if (!posStoreId && record.storeCode) {
        const store = await prisma.store.findUnique({ where: { code: record.storeCode } });
        posStoreId = store?.id;
      }
      if (!posStoreId) {
        errors.push(`POS流水缺少门店信息: ${JSON.stringify(record.rawData)}`);
        continue;
      }

      let memberId: string | undefined;
      if (record.memberNo) {
        const member = await prisma.member.findUnique({ where: { memberNo: record.memberNo } });
        memberId = member?.id;
      }

      await prisma.transaction.create({
        data: {
          memberId,
          storeId: posStoreId,
          batchId,
          type: record.type.toLowerCase().includes("deposit") || record.type.includes("储值")
            ? "deposit"
            : record.type.toLowerCase().includes("refund") || record.type.includes("退")
            ? "refund"
            : "consume",
          amount: record.amount,
          paymentMethod: mapPaymentMethod(record.paymentMethod),
          transactedAt: new Date(record.transactionTime),
        },
      });

      success++;
    } catch (e) {
      errors.push(`处理POS流水失败: ${(e as Error).message} - ${JSON.stringify(record.rawData)}`);
    }
  }

  return { success, errors };
}

function mapPaymentMethod(method: string): string {
  const m = method.toLowerCase();
  if (m.includes("储值") || m.includes("stored")) return "stored_value";
  if (m.includes("微信") || m.includes("wechat")) return "wechat";
  if (m.includes("支付宝") || m.includes("alipay")) return "alipay";
  if (m.includes("现金") || m.includes("cash")) return "cash";
  return method;
}
