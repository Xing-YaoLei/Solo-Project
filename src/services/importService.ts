import { prisma } from '@/lib/prisma';
import { generateBatchNo } from '@/utils/format';
import { BatchType, ImportBatch, Inventory, Transaction, Review } from '@/types';
import { getBatches, MOCK_INVENTORIES, generateMockTransactions, generateMockReviews } from './mockData';
import Papa from 'papaparse';

const USE_MOCK = true;

export async function createBatch(
  type: BatchType,
  fileName: string,
  importedBy: string
): Promise<ImportBatch> {
  if (USE_MOCK) {
    return {
      id: `batch-${Date.now()}`,
      batchNo: generateBatchNo(type),
      type,
      fileName,
      recordCount: 0,
      importedBy,
      importedAt: new Date(),
      status: 'PENDING',
    };
  }

  const batch = await prisma.importBatch.create({
    data: {
      batchNo: generateBatchNo(type),
      type,
      fileName,
      importedBy,
      status: 'PENDING',
    },
  });

  return batch;
}

export async function processBatch(
  batchId: string,
  fileContent: string,
  type: BatchType
): Promise<ImportBatch> {
  if (USE_MOCK) {
    return {
      id: batchId,
      batchNo: generateBatchNo(type),
      type,
      fileName: 'mock.csv',
      recordCount: 20,
      importedBy: '1',
      importedAt: new Date(),
      status: 'COMPLETED',
    };
  }

  await prisma.importBatch.update({
    where: { id: batchId },
    data: { status: 'PROCESSING' },
  });

  try {
    const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    const records = parsed.data as any[];

    if (type === 'INVENTORY') {
      await processInventoryBatch(batchId, records);
    } else if (type === 'TRANSACTION') {
      await processTransactionBatch(batchId, records);
    } else if (type === 'REVIEW') {
      await processReviewBatch(batchId, records);
    }

    const batch = await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: 'COMPLETED',
        recordCount: records.length,
      },
    });

    return batch;
  } catch (error: any) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
      },
    });
    throw error;
  }
}

async function processInventoryBatch(batchId: string, records: any[]): Promise<void> {
  const inventories = records.map(r => ({
    batchId,
    skuCode: r.sku_code || r.skuCode,
    productName: r.product_name || r.productName,
    category: r.category,
    unit: r.unit,
    stockQuantity: parseFloat(r.stock_quantity || r.stockQuantity || 0),
    unitPrice: parseFloat(r.unit_price || r.unitPrice || 0),
  }));

  await prisma.inventory.createMany({ data: inventories });

  await mergeInventoryToOrders(batchId);
}

async function processTransactionBatch(batchId: string, records: any[]): Promise<void> {
  const transactions = records.map(r => ({
    batchId,
    orderNo: r.order_no || r.orderNo,
    handNo: r.hand_no || r.handNo,
    technicianId: r.technician_id || r.technicianId,
    serviceItem: r.service_item || r.serviceItem,
    amount: parseFloat(r.amount || 0),
    paymentMethod: r.payment_method || r.paymentMethod,
    transactionTime: new Date(r.transaction_time || r.transactionTime),
    status: (r.status || 'PAID') as any,
  }));

  await prisma.transaction.createMany({ data: transactions });

  await mergeTransactionsToOrders(batchId);
}

async function processReviewBatch(batchId: string, records: any[]): Promise<void> {
  const reviews = records.map(r => ({
    batchId,
    orderNo: r.order_no || r.orderNo,
    rating: parseInt(r.rating || 0),
    content: r.content,
    hasBeforePhoto: (r.has_before_photo || r.hasBeforePhoto) === 'true' || r.has_before_photo === true,
    hasAfterPhoto: (r.has_after_photo || r.hasAfterPhoto) === 'true' || r.has_after_photo === true,
    followUpScript: r.follow_up_script || r.followUpScript,
    responded: (r.responded || r.responded) === 'true' || r.responded === true,
    reviewedAt: new Date(r.reviewed_at || r.reviewedAt),
  }));

  await prisma.review.createMany({ data: reviews });

  await updateOrderStatusFromReviews(batchId);
}

async function mergeInventoryToOrders(batchId: string): Promise<void> {
  const inventories = await prisma.inventory.findMany({ where: { batchId } });

  for (const inv of inventories) {
    const existingOrders = await prisma.handOrder.findMany({
      where: {
        inventoryItems: {
          some: {
            inventory: {
              skuCode: inv.skuCode,
            },
          },
        },
      },
    });

    if (existingOrders.length === 0) {
      const recentOrders = await prisma.handOrder.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' },
      });

      if (recentOrders.length > 0) {
        await prisma.inventoryUsage.create({
          data: {
            orderId: recentOrders[0].id,
            inventoryId: inv.id,
            quantity: inv.stockQuantity.toNumber() > 0 ? Math.min(1, inv.stockQuantity.toNumber()) : 0,
          },
        });
      }
    }
  }
}

async function mergeTransactionsToOrders(batchId: string): Promise<void> {
  const transactions = await prisma.transaction.findMany({ where: { batchId } });

  for (const trans of transactions) {
    let order = await prisma.handOrder.findUnique({
      where: { handNo: trans.handNo },
    });

    if (!order) {
      order = await prisma.handOrder.create({
        data: {
          handNo: trans.handNo,
          technicianId: trans.technicianId,
          serviceItems: [trans.serviceItem],
          totalAmount: trans.amount,
          status: 'PAID',
          completedAt: trans.transactionTime,
        },
      });
    } else {
      await prisma.handOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          totalAmount: trans.amount,
          serviceItems: {
            push: trans.serviceItem,
          },
          completedAt: trans.transactionTime,
        },
      });
    }
  }
}

async function updateOrderStatusFromReviews(batchId: string): Promise<void> {
  const reviews = await prisma.review.findMany({ where: { batchId } });

  for (const review of reviews) {
    const trans = await prisma.transaction.findUnique({
      where: { orderNo: review.orderNo },
    });

    if (trans) {
      await prisma.handOrder.updateMany({
        where: { handNo: trans.handNo },
        data: { status: 'REVIEWED' },
      });
    }
  }
}

export async function getImportBatches(
  type?: BatchType,
  page = 1,
  pageSize = 10
): Promise<{ batches: ImportBatch[]; total: number }> {
  if (USE_MOCK) {
    const all = getBatches();
    const filtered = type ? all.filter(b => b.type === type) : all;
    return {
      batches: filtered,
      total: filtered.length,
    };
  }

  const where = type ? { type } : {};
  const [batches, total] = await Promise.all([
    prisma.importBatch.findMany({
      where,
      include: { importer: true },
      orderBy: { importedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.importBatch.count({ where }),
  ]);

  return { batches: batches as unknown as ImportBatch[], total };
}

export async function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      (Papa.parse as any)(content, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<any>) => resolve(result.data),
        error: (error: Papa.ParseError) => reject(error),
      });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
