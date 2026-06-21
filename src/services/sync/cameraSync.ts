import { prisma } from "@/lib/prisma";
import {
  createSyncLog,
  updateSyncLogSuccess,
  updateSyncLogFailed,
  addSyncDetail,
  SyncResult,
  getLastSyncTime,
} from "./syncLogger";
import { startOfDay, endOfDay } from "date-fns";

export async function syncCameraStats(): Promise<SyncResult> {
  const syncLog = await createSyncLog("camera");

  try {
    const lastSync = await getLastSyncTime("camera");
    const windowStart = lastSync ? new Date(lastSync.getTime() + 1) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [areas, unprocessedStats] = await Promise.all([
      prisma.area.findMany(),
      prisma.cameraStat.findMany({
        where: { statDate: { gte: windowStart, lte: new Date() } },
        select: { areaId: true, visitorCount: true, statDate: true, statHour: true, id: true },
        orderBy: { statDate: "asc" },
      }),
    ]);

    const dailyAggregation = new Map<string, { areaId: string; date: Date; count: number }>();
    for (const stat of unprocessedStats) {
      const dayKey = `${stat.areaId}-${stat.statDate.toISOString().split("T")[0]}`;
      if (!dailyAggregation.has(dayKey)) {
        dailyAggregation.set(dayKey, { areaId: stat.areaId, date: startOfDay(stat.statDate), count: 0 });
      }
      dailyAggregation.get(dayKey)!.count += stat.visitorCount;
    }

    let totalRecords = 0;

    for (const [dayKey, agg] of dailyAggregation) {
      const existing = await prisma.dailyAreaStat.findFirst({
        where: { areaId: agg.areaId, statDate: { gte: startOfDay(agg.date), lte: endOfDay(agg.date) } },
      });

      const finalCount = existing ? existing.visitorCount + agg.count : agg.count;
      if (existing) {
        await prisma.dailyAreaStat.update({
          where: { id: existing.id },
          data: { visitorCount: finalCount },
        });
        await addSyncDetail(
          syncLog.id, dayKey, "UPDATE",
          `区域[${areas.find(a => a.id === agg.areaId)?.name}] 日客流更新: ${finalCount}人`
        );
      } else {
        const id = `das-${syncLog.id.slice(-8)}-${dayKey}`;
        await prisma.dailyAreaStat.create({
          data: { id, areaId: agg.areaId, statDate: agg.date, visitorCount: agg.count, merchantOrders: 0, totalAmount: 0 },
        });
        await addSyncDetail(
          syncLog.id, id, "INSERT",
          `区域[${areas.find(a => a.id === agg.areaId)?.name}] 日客流统计: ${agg.count}人`
        );
      }
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
