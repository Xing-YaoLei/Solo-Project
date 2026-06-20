import { prisma } from "@/lib/prisma";
import {
  createSyncLog,
  updateSyncLogSuccess,
  updateSyncLogFailed,
  addSyncDetail,
  SyncResult,
} from "./syncLogger";

export async function syncMiniappOrders(): Promise<SyncResult> {
  const syncLog = await createSyncLog("miniapp");

  try {
    const routes = await prisma.tourRoute.findMany();
    let totalRecords = 0;

    for (const route of routes) {
      const mockOrders = generateMockMiniappOrders(route.id);

      for (const order of mockOrders) {
        const existing = await prisma.miniappOrder.findUnique({
          where: { id: order.id },
        });

        if (!existing) {
          await prisma.miniappOrder.create({ data: order });
          await addSyncDetail(
            syncLog.id,
            order.id,
            "create",
            `路线 ${route.name} 小程序订单: ${order.amount}`
          );
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

function generateMockMiniappOrders(routeId: string) {
  const orders = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const orderTime = new Date(
      now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
    );
    orders.push({
      id: `miniapp-order-${routeId}-${i}-${Date.now()}`,
      userId: `user-${Math.floor(Math.random() * 1000)}`,
      routeId,
      amount: Math.floor(Math.random() * 200) + 30,
      orderTime,
      status: Math.random() > 0.15 ? "paid" : "cancelled",
    });
  }
  return orders;
}
