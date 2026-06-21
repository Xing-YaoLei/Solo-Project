import { prisma } from "@/lib/prisma";
import {
  createSyncLog,
  updateSyncLogSuccess,
  updateSyncLogFailed,
  addSyncDetail,
  SyncResult,
  getLastSyncTime,
} from "./syncLogger";

const ORDER_RATE = 0.015;
const PAID_RATE = 0.88;

export async function syncMiniappOrders(): Promise<SyncResult> {
  const syncLog = await createSyncLog("miniapp");

  try {
    const lastSync = await getLastSyncTime("miniapp");
    const windowStart = lastSync ? new Date(lastSync.getTime() + 1) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [users, routes, cameraStats, contracts] = await Promise.all([
      prisma.miniappUser.findMany(),
      prisma.tourRoute.findMany({ include: { points: true } }),
      prisma.cameraStat.findMany({
        where: { statDate: { gte: windowStart, lte: new Date() } },
        select: { areaId: true, visitorCount: true, statDate: true },
      }),
      prisma.contract.findMany({ select: { caliberNote: true, merchantId: true } }),
    ]);

    const areaVisitorMap = new Map<string, { count: number; date: Date }[]>();
    for (const stat of cameraStats) {
      if (!areaVisitorMap.has(stat.areaId)) areaVisitorMap.set(stat.areaId, []);
      areaVisitorMap.get(stat.areaId)!.push({ count: stat.visitorCount, date: stat.statDate });
    }

    let totalRecords = 0;
    const now = Date.now();
    let userIdx = 0;

    for (const route of routes) {
      let routeVisitors = 0;
      const routeDates: Date[] = [];
      for (const point of route.points) {
        const stats = areaVisitorMap.get(point.areaId) || [];
        for (const stat of stats) {
          routeVisitors += stat.count;
          routeDates.push(stat.date);
        }
      }
      if (routeVisitors === 0) continue;

      const estimatedOrders = Math.max(1, Math.floor(routeVisitors * ORDER_RATE / routes.length));
      const routePrice = Math.max(30, Math.round(route.points.length * 15));

      for (let i = 0; i < estimatedOrders; i++) {
        const id = `mio-${syncLog.id.slice(-8)}-${route.id}-${i}-${now}`;
        const user = users[userIdx % users.length];
        userIdx++;
        const orderDate = routeDates[i % routeDates.length] || new Date();
        const orderTime = new Date(orderDate.getTime() + Math.floor((i / estimatedOrders) * 7200000));
        const amount = Number((routePrice * (0.8 + (i % 4) * 0.1)).toFixed(2));
        const status = i < estimatedOrders * PAID_RATE ? "paid" : "cancelled";

        await prisma.miniappOrder.create({
          data: { id, userId: user.id, routeId: route.id, amount, orderTime, status },
        });
        await addSyncDetail(
          syncLog.id, id, "INSERT",
          `用户[${user.nickname || user.id}] 路线[${route.name}] 订单: ¥${amount}`
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
