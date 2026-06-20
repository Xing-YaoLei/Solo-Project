import { prisma } from "@/lib/prisma";
import {
  createSyncLog,
  updateSyncLogSuccess,
  updateSyncLogFailed,
  addSyncDetail,
  SyncResult,
} from "./syncLogger";

export async function syncCameraStats(): Promise<SyncResult> {
  const syncLog = await createSyncLog("camera");

  try {
    const areas = await prisma.area.findMany();
    let totalRecords = 0;

    for (const area of areas) {
      const mockStats = generateMockCameraStats(area.id, area.id);

      for (const stat of mockStats) {
        const existing = await prisma.cameraStat.findFirst({
          where: {
            cameraId: stat.cameraId,
            statDate: stat.statDate,
            statHour: stat.statHour,
          },
        });

        if (!existing) {
          await prisma.cameraStat.create({ data: stat });
          await addSyncDetail(
            syncLog.id,
            stat.id,
            "create",
            `区域 ${area.name} 客流统计: ${stat.visitorCount}人`
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

function generateMockCameraStats(areaId: string, cameraId: string) {
  const stats = [];
  const now = new Date();
  for (let hour = 8; hour < 20; hour++) {
    for (let day = 0; day < 7; day++) {
      const statDate = new Date(now);
      statDate.setDate(statDate.getDate() - day);
      statDate.setHours(hour, 0, 0, 0);

      stats.push({
        id: `camera-stat-${areaId}-${day}-${hour}-${Date.now()}`,
        cameraId: `cam-${cameraId}`,
        areaId,
        visitorCount: Math.floor(Math.random() * 200) + 50,
        statDate,
        statHour: hour,
      });
    }
  }
  return stats;
}
