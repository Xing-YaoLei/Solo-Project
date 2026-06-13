import { generateBatchNo } from '@/utils/format';
import { BatchType, ImportBatch, Inventory, Transaction, Review, HandOrder, InventoryUsage } from '@/types';
import { mockStore } from './mockStore';
import Papa from 'papaparse';

const USE_MOCK = true;

export async function createBatch(
  type: BatchType,
  fileName: string,
  importedBy: string
): Promise<ImportBatch> {
  if (USE_MOCK) {
    const batch: ImportBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchNo: generateBatchNo(type),
      type,
      fileName,
      recordCount: 0,
      importedBy,
      importedAt: new Date(),
      status: 'PENDING',
    };
    mockStore.addBatch(batch);
    return batch;
  }

  const { prisma } = await import('@/lib/prisma');
  const batch = await prisma.importBatch.create({
    data: {
      batchNo: generateBatchNo(type),
      type,
      fileName,
      importedBy,
      status: 'PENDING',
    },
  });

  return batch as unknown as ImportBatch;
}

export async function processBatch(
  batchId: string,
  fileContent: string,
  type: BatchType
): Promise<ImportBatch> {
  if (USE_MOCK) {
    mockStore.updateBatch(batchId, { status: 'PROCESSING' });

    try {
      const parsed = (Papa.parse as any)(fileContent, { header: true, skipEmptyLines: true });
      const records = parsed.data as any[];

      if (type === 'INVENTORY') {
        await processInventoryBatch(batchId, records);
      } else if (type === 'TRANSACTION') {
        await processTransactionBatch(batchId, records);
      } else if (type === 'REVIEW') {
        await processReviewBatch(batchId, records);
      }

      const batch = mockStore.batches.find(b => b.id === batchId);
      if (batch) {
        mockStore.updateBatch(batchId, {
          status: 'COMPLETED',
          recordCount: records.length,
        });
        return { ...batch, status: 'COMPLETED', recordCount: records.length };
      }
      return {
        id: batchId,
        batchNo: generateBatchNo(type),
        type,
        fileName: 'mock.csv',
        recordCount: records.length,
        importedBy: '1',
        importedAt: new Date(),
        status: 'COMPLETED',
      };
    } catch (error: any) {
      mockStore.updateBatch(batchId, {
        status: 'FAILED',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  const { prisma } = await import('@/lib/prisma');
  await prisma.importBatch.update({
    where: { id: batchId },
    data: { status: 'PROCESSING' },
  });

  try {
    const parsed = (Papa.parse as any)(fileContent, { header: true, skipEmptyLines: true });
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

    return batch as unknown as ImportBatch;
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
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');

  const inventories: Inventory[] = records.map((r, index) => ({
    id: `inv-${batchId}-${index}`,
    batchId,
    skuCode: r.sku_code || r.skuCode || `SKU-${Date.now()}-${index}`,
    productName: r.product_name || r.productName || `产品${index + 1}`,
    category: r.category || '未分类',
    unit: r.unit || '个',
    stockQuantity: parseFloat(r.stock_quantity || r.stockQuantity || 0),
    unitPrice: parseFloat(r.unit_price || r.unitPrice || 0),
    importedAt: new Date(),
  }));

  mockStore.addInventories(inventories);

  for (const inv of inventories) {
    const techIdx = mockStore.inventories.indexOf(inv) % technicians.length;
    const tech = technicians[techIdx] || technicians[0];
    const handNo = `H${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

    const order: HandOrder = {
      id: `order-${inv.id}`,
      handNo,
      technicianId: tech.id,
      serviceItems: [inv.productName],
      totalAmount: inv.unitPrice,
      status: 'CREATED',
      createdAt: new Date(),
      technician: tech,
      transactions: [],
      inventoryItems: [],
    };
    mockStore.upsertOrder(order);

    const usage: InventoryUsage = {
      id: `usage-${inv.id}`,
      orderId: order.id,
      inventoryId: inv.id,
      quantity: Math.min(inv.stockQuantity, 1),
      isAbnormal: false,
      inventory: inv,
    };
    mockStore.addInventoryUsage(usage);
  }
}

async function processTransactionBatch(batchId: string, records: any[]): Promise<void> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');

  const transactions: Transaction[] = records.map((r, index) => {
    const techId = r.technician_id || r.technicianId || technicians[index % technicians.length].id;
    const tech = mockStore.getUserById(techId);
    return {
      id: `trans-${batchId}-${index}`,
      batchId,
      orderNo: r.order_no || r.orderNo || `ORD-${Date.now()}-${index}`,
      handNo: r.hand_no || r.handNo || `H${Date.now()}-${index}`,
      technicianId: techId,
      serviceItem: r.service_item || r.serviceItem || '常规服务',
      amount: parseFloat(r.amount || 0),
      paymentMethod: r.payment_method || r.paymentMethod || '微信',
      transactionTime: new Date(r.transaction_time || r.transactionTime || Date.now()),
      status: 'PAID',
      technician: tech,
    };
  });

  mockStore.addTransactions(transactions);

  for (const trans of transactions) {
    const tech = mockStore.getUserById(trans.technicianId);
    const existingOrder = mockStore.orders.find(o => o.handNo === trans.handNo);

    if (existingOrder) {
      const existingTrans = existingOrder.transactions || [];
      const newTotal = existingTrans.reduce((s, t) => s + t.amount, 0) + trans.amount;
      mockStore.updateOrderByHandNo(trans.handNo, {
        status: 'PAID',
        totalAmount: newTotal,
        serviceItems: [...(existingOrder.serviceItems || []), trans.serviceItem],
        completedAt: trans.transactionTime,
        transactions: [...existingTrans, trans],
      });
    } else {
      const order: HandOrder = {
        id: `order-${trans.id}`,
        handNo: trans.handNo,
        technicianId: trans.technicianId,
        serviceItems: [trans.serviceItem],
        totalAmount: trans.amount,
        status: 'PAID',
        createdAt: trans.transactionTime,
        completedAt: trans.transactionTime,
        technician: tech,
        transactions: [trans],
        inventoryItems: [],
      };
      mockStore.upsertOrder(order);
    }
  }
}

async function processReviewBatch(batchId: string, records: any[]): Promise<void> {
  const reviews: Review[] = records.map((r, index) => ({
    id: `review-${batchId}-${index}`,
    batchId,
    orderNo: r.order_no || r.orderNo || `ORD-${Date.now()}-${index}`,
    rating: parseInt(r.rating || 5),
    content: r.content || '',
    hasBeforePhoto: (r.has_before_photo || r.hasBeforePhoto) === 'true' || r.has_before_photo === true,
    hasAfterPhoto: (r.has_after_photo || r.hasAfterPhoto) === 'true' || r.has_after_photo === true,
    followUpScript: r.follow_up_script || r.followUpScript || null,
    responded: (r.responded || 'false') === 'true' || r.responded === true,
    reviewedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
  }));

  mockStore.addReviews(reviews);

  for (const review of reviews) {
    const matchedTrans = mockStore.transactions.find(t => t.orderNo === review.orderNo);
    if (matchedTrans) {
      mockStore.updateOrderByHandNo(matchedTrans.handNo, {
        status: 'REVIEWED',
        review,
      });
    } else {
      const techs = mockStore.users.filter(u => u.role === 'TECHNICIAN');
      const tech = techs[0];
      const handNo = `H-REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
      const order: HandOrder = {
        id: `order-review-${review.id}`,
        handNo,
        technicianId: tech.id,
        serviceItems: ['服务项目'],
        totalAmount: 0,
        status: 'REVIEWED',
        createdAt: review.reviewedAt,
        completedAt: review.reviewedAt,
        technician: tech,
        transactions: [],
        review,
      };
      mockStore.upsertOrder(order);
    }
  }
}

export async function getImportBatches(
  type?: BatchType,
  page = 1,
  pageSize = 10
): Promise<{ batches: ImportBatch[]; total: number }> {
  if (USE_MOCK) {
    const all = mockStore.batches;
    const filtered = type ? all.filter(b => b.type === type) : all;
    return {
      batches: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
    };
  }

  const { prisma } = await import('@/lib/prisma');
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
