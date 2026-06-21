import { prisma } from "@/lib/prisma";
import {
  createSyncLog,
  updateSyncLogSuccess,
  updateSyncLogFailed,
  addSyncDetail,
  SyncResult,
  getLastSyncTime,
} from "./syncLogger";

const CONVERSION_RATE = 0.02;
const PAID_RATE = 0.92;

export async function syncMerchantOrders(): Promise<SyncResult> {
  const syncLog = await createSyncLog("merchant");

  try {
    const lastSync = await getLastSyncTime("merchant");
    const windowStart = lastSync ? new Date(lastSync.getTime() + 1) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [merchants, cameraStats] = await Promise.all([
      prisma.merchant.findMany({ include: { contract: true, area: true } }),
      prisma.cameraStat.findMany({
        where: { statDate: { gte: windowStart, lte: new Date() } },
        select: { areaId: true, visitorCount: true, statDate: true },
      }),
    ]);

    const areaVisitorMap = new Map<string, { count: number; date: Date }[]>();
    for (const stat of cameraStats) {
      if (!areaVisitorMap.has(stat.areaId)) areaVisitorMap.set(stat.areaId, []);
      areaVisitorMap.get(stat.areaId)!.push({ count: stat.visitorCount, date: stat.statDate });
    }

    let totalRecords = 0;
    const now = Date.now();

    for (const merchant of merchants) {
      const areaStats = areaVisitorMap.get(merchant.areaId) || [];
      if (areaStats.length === 0) continue;

      const contractAmount = merchant.contractAmount;
      const avgOrderAmount = Math.max(20, Math.round(contractAmount / 10000));

      for (let s = 0; s < areaStats.length; s++) {
        const stat = areaStats[s];
        const estimatedOrders = Math.max(1, Math.floor(stat.count * CONVERSION_RATE / merchants.length));

        for (let i = 0; i < estimatedOrders; i++) {
          const id = `mo-${syncLog.id.slice(-8)}-${merchant.id}-${s}-${i}-${now}`;
          const orderTime = new Date(stat.date.getTime() + Math.floor((i / estimatedOrders) * 3600000));
          const amount = Number((avgOrderAmount * (0.7 + (i % 5) * 0.15)).toFixed(2));
          const source = i % 2 === 0 ? "offline" : "miniapp";
          const status = i < estimatedOrders * PAID_RATE ? "paid" : "refunded";

          await prisma.merchantOrder.create({
            data: { id, merchantId: merchant.id, amount, orderTime, source, status },
          });
          await addSyncDetail(
            syncLog.id, id, "INSERT",
            `商户[${merchant.name}] 新订单: ¥${amount} (${status === "paid" ? "已支付" : "已退款"})`
          );
          totalRecords++;
        }
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
