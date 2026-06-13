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
        let member = await prisma.member.findUnique({ where: { memberNo: record.memberNo } });
        if (!member) {
          member = await prisma.member.create({
            data: {
              memberNo: record.memberNo,
              name: `会员${record.memberNo.slice(-4)}`,
              storeId: posStoreId,
            },
          });
        }
        memberId = member.id;
      }

      const txType = record.type.toLowerCase().includes("deposit") || record.type.includes("储值")
        ? "deposit"
        : record.type.toLowerCase().includes("refund") || record.type.includes("退")
        ? "refund"
        : "consume";
      const paymentMethod = mapPaymentMethod(record.paymentMethod);
      const transactedAt = new Date(record.transactionTime);

      const transaction = await prisma.transaction.create({
        data: {
          memberId,
          storeId: posStoreId,
          batchId,
          type: txType,
          amount: record.amount,
          paymentMethod,
          transactedAt,
        },
      });

      if (memberId && paymentMethod === "stored_value") {
        let account = await prisma.storedValueAccount.findFirst({
          where: { memberId, isActive: true },
        });
        if (!account && txType === "deposit") {
          account = await prisma.storedValueAccount.create({
            data: {
              memberId,
              balance: 0,
            },
          });
        }

        if (account) {
          const flowAmount = txType === "deposit" ? record.amount : -record.amount;
          await prisma.accountFlow.create({
            data: {
              accountId: account.id,
              transactionId: transaction.id,
              batchId,
              type: txType,
              amount: flowAmount,
              occurredAt: transactedAt,
              source: "pos",
            },
          });

          if (txType === "deposit") {
            await prisma.storedValueAccount.update({
              where: { id: account.id },
              data: { balance: { increment: record.amount } },
            });
          } else if (txType === "consume") {
            await prisma.storedValueAccount.update({
              where: { id: account.id },
              data: { balance: { decrement: record.amount } },
            });
          }
        }
      }

      if (memberId && txType === "deposit") {
        await prisma.member.update({
          where: { id: memberId },
          data: { totalStored: { increment: record.amount } },
        });
      }

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
