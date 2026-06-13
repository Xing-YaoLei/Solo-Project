import Papa from "papaparse";

export interface ReceiptRecord {
  memberNo: string;
  storeCode?: string;
  transactionTime: string;
  totalAmount: number;
  storedValueDeduction: number;
  items?: string;
  rawData: Record<string, unknown>;
}

export function parseReceiptCSV(content: string): ReceiptRecord[] {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  return result.data
    .filter((row) => row.memberno || row["会员号"])
    .map((row) => ({
      memberNo: row.memberno || row["会员号"] || "",
      storeCode: row.storecode || row["门店编码"],
      transactionTime: row.transactiontime || row["交易时间"] || new Date().toISOString(),
      totalAmount: parseFloat(row.totalamount || row["总金额"] || "0"),
      storedValueDeduction: parseFloat(row.storedvaluededuction || row["储值抵扣"] || "0"),
      items: row.items || row["商品明细"],
      rawData: row as unknown as Record<string, unknown>,
    }));
}

export async function processReceipts(
  records: ReceiptRecord[],
  batchId: string,
  storeId?: string
): Promise<{ success: number; errors: string[] }> {
  const { prisma } = await import("@/lib/prisma");
  let success = 0;
  const errors: string[] = [];

  for (const record of records) {
    try {
      let memberStoreId = storeId;
      if (!memberStoreId && record.storeCode) {
        const store = await prisma.store.findUnique({ where: { code: record.storeCode } });
        memberStoreId = store?.id;
      }
      if (!memberStoreId) {
        errors.push(`小票缺少门店信息: ${JSON.stringify(record.rawData)}`);
        continue;
      }

      let member = await prisma.member.findUnique({ where: { memberNo: record.memberNo } });
      if (!member) {
        member = await prisma.member.create({
          data: {
            memberNo: record.memberNo,
            name: `会员${record.memberNo.slice(-4)}`,
            storeId: memberStoreId,
          },
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          memberId: member.id,
          storeId: memberStoreId,
          batchId,
          type: "consume",
          amount: record.totalAmount,
          paymentMethod: record.storedValueDeduction > 0 ? "stored_value" : "wechat",
          transactedAt: new Date(record.transactionTime),
        },
      });

      await prisma.receipt.create({
        data: {
          batchId,
          transactionId: transaction.id,
          memberId: member.id,
          rawData: JSON.stringify(record.rawData),
          totalAmount: record.totalAmount,
          storedValueDeduction: record.storedValueDeduction,
        },
      });

      if (record.storedValueDeduction > 0) {
        let account = await prisma.storedValueAccount.findFirst({
          where: { memberId: member.id, isActive: true },
        });
        if (!account) {
          account = await prisma.storedValueAccount.create({
            data: {
              memberId: member.id,
              balance: 0,
            },
          });
        }

        await prisma.accountFlow.create({
          data: {
            accountId: account.id,
            transactionId: transaction.id,
            batchId,
            type: "consume",
            amount: -record.storedValueDeduction,
            occurredAt: new Date(record.transactionTime),
            source: "pos",
          },
        });
        await prisma.storedValueAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: record.storedValueDeduction } },
        });
      }

      success++;
    } catch (e) {
      errors.push(`处理小票失败: ${(e as Error).message} - ${JSON.stringify(record.rawData)}`);
    }
  }

  return { success, errors };
}
