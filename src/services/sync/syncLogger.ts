import { prisma } from "@/lib/prisma";

export type SyncSourceType = "merchant" | "miniapp" | "camera";

export interface SyncResult {
  success: boolean;
  recordCount: number;
  errorMessage?: string;
}

export async function createSyncLog(sourceType: SyncSourceType) {
  return prisma.syncLog.create({
    data: {
      sourceType,
      startTime: new Date(),
      status: "running",
      recordCount: 0,
    },
  });
}

export async function updateSyncLogSuccess(
  syncLogId: string,
  recordCount: number
) {
  return prisma.syncLog.update({
    where: { id: syncLogId },
    data: {
      status: "success",
      endTime: new Date(),
      recordCount,
    },
  });
}

export async function updateSyncLogFailed(
  syncLogId: string,
  errorMessage: string
) {
  return prisma.syncLog.update({
    where: { id: syncLogId },
    data: {
      status: "failed",
      endTime: new Date(),
      errorMessage,
    },
  });
}

export async function addSyncDetail(
  syncLogId: string,
  recordId: string,
  action: string,
  detail: string
) {
  return prisma.syncDetail.create({
    data: {
      syncLogId,
      recordId,
      action,
      detail,
    },
  });
}

export async function getLastSyncTime(sourceType: SyncSourceType): Promise<Date | null> {
  const lastLog = await prisma.syncLog.findFirst({
    where: { sourceType, status: "success" },
    orderBy: { endTime: "desc" },
    select: { endTime: true },
  });
  return lastLog?.endTime || null;
}
