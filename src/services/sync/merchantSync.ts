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
      const mockOrders = generateMockMerchantOrders(merchant.id);

      for (const order of mockOrders) {
        const existing = await prisma.merchantOrder.findUnique({
          where: { id: order.id },
        });

        if (!existing) {
          await prisma.merchantOrder.create({ data: order });
          await addSyncDetail(syncLog.id, order.id, "create", `商户 ${merchant.name} 新订单: ${order.amount}`);
          totalRecords++;
        }
      }
    }

    await updateSyncLogSuccess(syncLog.id, totalRecords);
    return { success: true, recordCount: totalRecords };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await updateSyncLogFailed(syncLog.id, message);
    return { success: false, recordCount: 0, errorMessage: message };
  }
}

function generateMockMerchantOrders(merchantId: string) {
  const orders = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const orderTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    orders.push({
      id: `merchant-order-${merchantId}-${i}-${Date.now()}`,
      merchantId,
      amount: Math.floor(Math.random() * 500) + 50,
      orderTime,
      source: Math.random() > 0.5 ? "offline" : "miniapp",
      status: Math.random() > 0.1 ? "paid" : "refunded",
    });
  }
  return orders;
}
