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
      const batchSize = Math.floor(Math.random() * 20) + 10;
      for (let i = 0; i < batchSize; i++) {
        const id = `cs-${syncLog.id.slice(-8)}-${area.id}-${i}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const statDate = new Date(Date.now() - Math.floor(Math.random() * 48) * 60 * 60 * 1000);
        statDate.setMinutes(0, 0, 0);
        const hour = statDate.getHours();

        await prisma.cameraStat.create({
          data: {
            id,
            cameraId: `cam-${area.id}-${String(Math.floor(Math.random() * 3) + 1).padStart(2, "0")}`,
            areaId: area.id,
            visitorCount: Math.floor(Math.random() * 200) + 50,
            statDate,
            statHour: hour,
          },
        });
        await addSyncDetail(
          syncLog.id,
          id,
          "INSERT",
          `区域[${area.name}] 摄像头客流: ${hour}:00 时段 ${Math.floor(Math.random() * 200) + 50}人`
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
