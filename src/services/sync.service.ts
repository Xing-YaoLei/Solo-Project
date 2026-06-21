import { prisma } from "@/lib/prisma";
import { SyncSource, SyncStatus } from "@prisma/client";

export class SyncService {
  static async createBatch(source: SyncSource, totalCount: number = 0) {
    const batchNumber = `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return prisma.syncBatch.create({
      data: {
        batchNumber,
        source,
        status: SyncStatus.PENDING,
        totalCount,
        successCount: 0,
        failedCount: 0,
      },
    });
  }

  static async startBatch(batchId: string) {
    return prisma.syncBatch.update({
      where: { id: batchId },
      data: {
        status: SyncStatus.RUNNING,
        startedAt: new Date(),
      },
    });
  }

  static async completeBatch(
    batchId: string,
    successCount: number,
    failedCount: number,
    errorMessage?: string
  ) {
    const status = failedCount === 0 
      ? SyncStatus.SUCCESS 
      : successCount === 0 
        ? SyncStatus.FAILED 
        : SyncStatus.PARTIAL;

    return prisma.syncBatch.update({
      where: { id: batchId },
      data: {
        status,
        successCount,
        failedCount,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  static async syncOrders(data: Array<{
    orderNo: string;
    regionId: string;
    riderId?: string;
    riderName?: string;
    pickupAddress: string;
    deliveryAddress: string;
    itemType: string;
    itemValue: number;
    distance: number;
    status: string;
    dispatchDuration?: number;
    deliveryDuration?: number;
    totalDuration?: number;
    orderedAt: Date;
    assignedAt?: Date;
    pickedUpAt?: Date;
    deliveredAt?: Date;
  }>) {
    const batch = await this.createBatch(SyncSource.ORDER_SYSTEM, data.length);
    await this.startBatch(batch.id);

    let successCount = 0;
    let failedCount = 0;
    let errorMessage: string | undefined;

    for (const item of data) {
      try {
        await prisma.order.upsert({
          where: { orderNo: item.orderNo },
          update: {
            ...item,
            syncBatchId: batch.id,
          },
          create: {
            ...item,
            syncBatchId: batch.id,
          },
        });
        successCount++;
      } catch (error) {
        failedCount++;
        if (!errorMessage) {
          errorMessage = error instanceof Error ? error.message : "Unknown error";
        }
      }
    }

    await this.completeBatch(batch.id, successCount, failedCount, errorMessage);
    return { batchId: batch.id, successCount, failedCount };
  }

  static async syncPayments(data: Array<{
    transactionNo: string;
    orderId: string;
    amount: number;
    subsidyAmount: number;
    baseFee: number;
    paymentMethod: string;
    paidAt: Date;
  }>) {
    const batch = await this.createBatch(SyncSource.PAYMENT_SYSTEM, data.length);
    await this.startBatch(batch.id);

    let successCount = 0;
    let failedCount = 0;
    let errorMessage: string | undefined;

    for (const item of data) {
      try {
        await prisma.paymentTransaction.upsert({
          where: { transactionNo: item.transactionNo },
          update: {
            ...item,
            syncBatchId: batch.id,
          },
          create: {
            ...item,
            syncBatchId: batch.id,
          },
        });
        successCount++;
      } catch (error) {
        failedCount++;
        if (!errorMessage) {
          errorMessage = error instanceof Error ? error.message : "Unknown error";
        }
      }
    }

    await this.completeBatch(batch.id, successCount, failedCount, errorMessage);
    return { batchId: batch.id, successCount, failedCount };
  }

  static async syncMapRecords(data: Array<{
    orderId: string;
    routeDistance: number;
    estimatedDuration: number;
    actualDuration?: number;
    trafficLevel: string;
    weatherCondition?: string;
    mapProvider: string;
    syncedAt: Date;
  }>) {
    const batch = await this.createBatch(SyncSource.MAP_API, data.length);
    await this.startBatch(batch.id);

    let successCount = 0;
    let failedCount = 0;
    let errorMessage: string | undefined;

    for (const item of data) {
      try {
        await prisma.mapRecord.upsert({
          where: { orderId: item.orderId },
          update: {
            ...item,
            syncBatchId: batch.id,
          },
          create: {
            ...item,
            syncBatchId: batch.id,
          },
        });
        successCount++;
      } catch (error) {
        failedCount++;
        if (!errorMessage) {
          errorMessage = error instanceof Error ? error.message : "Unknown error";
        }
      }
    }

    await this.completeBatch(batch.id, successCount, failedCount, errorMessage);
    return { batchId: batch.id, successCount, failedCount };
  }

  static async getBatchList(source?: SyncSource, status?: SyncStatus, limit: number = 20) {
    return prisma.syncBatch.findMany({
      where: {
        ...(source && { source }),
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async getBatchDetail(batchId: string) {
    return prisma.syncBatch.findUnique({
      where: { id: batchId },
      include: {
        orders: { take: 10 },
        paymentTransactions: { take: 10 },
        mapRecords: { take: 10 },
      },
    });
  }
}
