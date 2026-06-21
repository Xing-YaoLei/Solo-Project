import { prisma } from "@/lib/prisma";
import { SyncSource, SyncStatus, OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

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
    status: OrderStatus;
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
        const orderData: Prisma.OrderUncheckedCreateInput = {
          orderNo: item.orderNo,
          regionId: item.regionId,
          riderId: item.riderId,
          riderName: item.riderName,
          pickupAddress: item.pickupAddress,
          deliveryAddress: item.deliveryAddress,
          itemType: item.itemType,
          itemValue: new Prisma.Decimal(item.itemValue),
          distance: new Prisma.Decimal(item.distance),
          status: item.status,
          dispatchDuration: item.dispatchDuration,
          deliveryDuration: item.deliveryDuration,
          totalDuration: item.totalDuration,
          orderedAt: item.orderedAt,
          assignedAt: item.assignedAt,
          pickedUpAt: item.pickedUpAt,
          deliveredAt: item.deliveredAt,
          syncBatchId: batch.id,
        };

        await prisma.order.upsert({
          where: { orderNo: item.orderNo },
          update: orderData,
          create: orderData,
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
        const paymentData: Prisma.PaymentTransactionUncheckedCreateInput = {
          transactionNo: item.transactionNo,
          orderId: item.orderId,
          amount: new Prisma.Decimal(item.amount),
          subsidyAmount: new Prisma.Decimal(item.subsidyAmount),
          baseFee: new Prisma.Decimal(item.baseFee),
          paymentMethod: item.paymentMethod,
          paidAt: item.paidAt,
          syncBatchId: batch.id,
        };

        await prisma.paymentTransaction.upsert({
          where: { transactionNo: item.transactionNo },
          update: paymentData,
          create: paymentData,
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
        const mapData: Prisma.MapRecordUncheckedCreateInput = {
          orderId: item.orderId,
          routeDistance: new Prisma.Decimal(item.routeDistance),
          estimatedDuration: item.estimatedDuration,
          actualDuration: item.actualDuration,
          trafficLevel: item.trafficLevel,
          weatherCondition: item.weatherCondition,
          mapProvider: item.mapProvider,
          syncedAt: item.syncedAt,
          syncBatchId: batch.id,
        };

        await prisma.mapRecord.upsert({
          where: { orderId: item.orderId },
          update: mapData,
          create: mapData,
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

  static async getBatchStats() {
    const [paymentBatches, orderBatches, mapBatches] = await Promise.all([
      prisma.syncBatch.findMany({
        where: { source: SyncSource.PAYMENT_SYSTEM },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
      prisma.syncBatch.findMany({
        where: { source: SyncSource.ORDER_SYSTEM },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
      prisma.syncBatch.findMany({
        where: { source: SyncSource.MAP_API },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
    ]);

    return {
      payment: {
        count: await prisma.syncBatch.count({ where: { source: SyncSource.PAYMENT_SYSTEM } }),
        latest: paymentBatches[0] || null,
      },
      order: {
        count: await prisma.syncBatch.count({ where: { source: SyncSource.ORDER_SYSTEM } }),
        latest: orderBatches[0] || null,
      },
      map: {
        count: await prisma.syncBatch.count({ where: { source: SyncSource.MAP_API } }),
        latest: mapBatches[0] || null,
      },
    };
  }
}
