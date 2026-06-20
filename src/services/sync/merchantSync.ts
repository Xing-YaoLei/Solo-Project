import { prisma } from "@/lib/prisma";
import {
  createSyncLog,
  updateSyncLogSuccess,
  updateSyncLogFailed,
  addSyncDetail,
  SyncResult,
} from "./syncLogger";

export async function syncMerchantOrders(): Promise<SyncResult> {
  const syncLog = await createSyncLog("merchant");

  try {
    const merchants = await prisma.merchant.findMany();
    let totalRecords = 0;

    for (const merchant of merchants) {
      const batchSize = Math.floor(Math.random() * 15) + 5;
      for (let i = 0; i < batchSize; i++) {
        const id = `mo-${syncLog.id.slice(-8)}-${merchant.id}-${i}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const orderTime = new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000);
        const amount = Number((Math.random() * 500 + 20).toFixed(2));
        const source = Math.random() > 0.5 ? "offline" : "miniapp";
        const status = Math.random() > 0.08 ? "paid" : "refunded";

        await prisma.merchantOrder.create({
          data: {
            id,
            merchantId: merchant.id,
            amount,
            orderTime,
            source,
            status,
          },
        });
        await addSyncDetail(
          syncLog.id,
          id,
          "INSERT",
          `商户[${merchant.name}] 新订单: ¥${amount} (${status === "paid" ? "已支付" : "已退款"})`
        );
        totalRecords++;
      }
    }

    await updateSyncLogSuccess(syncLog.id, totalRecords);
    return { success: true, recordCount: totalRecords };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    await updateSyncLogFailed(syncLog.id, message);
    return { success: false, recordCount: 0, errorMessage: message };
  }
}
