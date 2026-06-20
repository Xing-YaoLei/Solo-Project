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
    const [users, routes] = await Promise.all([
      prisma.miniappUser.findMany(),
      prisma.tourRoute.findMany(),
    ]);
    let totalRecords = 0;

    const batchSize = Math.floor(Math.random() * 20) + 8;
    for (let i = 0; i < batchSize; i++) {
      const id = `mio-${syncLog.id.slice(-8)}-${i}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const user = users[Math.floor(Math.random() * users.length)];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const orderTime = new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000);
      const amount = Number((Math.random() * 250 + 30).toFixed(2));
      const status = Math.random() > 0.12 ? "paid" : "cancelled";

      await prisma.miniappOrder.create({
        data: {
          id,
          userId: user.id,
          routeId: route.id,
          amount,
          orderTime,
          status,
        },
      });
      await addSyncDetail(
        syncLog.id,
        id,
        "INSERT",
        `用户[${user.nickname || user.id}] 路线[${route.name}] 订单: ¥${amount}`
      );
      totalRecords++;
    }

    await updateSyncLogSuccess(syncLog.id, totalRecords);
    return { success: true, recordCount: totalRecords };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    await updateSyncLogFailed(syncLog.id, message);
    return { success: false, recordCount: 0, errorMessage: message };
  }
}
