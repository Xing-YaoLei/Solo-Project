import { generateBatchNo } from '@/utils/format';
import { BatchType, ImportBatch } from '@/types';
import { mockStore } from './mockStore';
import Papa from 'papaparse';
import { CONFIG } from './config';

export async function createBatch(
  type: BatchType,
  fileName: string,
  importedBy: string
): Promise<ImportBatch> {
  if (CONFIG.USE_MOCK) {
    const batch: ImportBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
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

  return normalizeBatch(batch);
}

export async function processBatch(
  batchId: string,
  fileContent: string,
  type: BatchType
): Promise<ImportBatch> {
  if (CONFIG.USE_MOCK) {
    mockStore.updateBatch(batchId, { status: 'PROCESSING' });

    try {
      const parsed = (Papa.parse as any)(fileContent, { header: true, skipEmptyLines: true });
      const records = parsed.data as any[];

      if (type === 'INVENTORY') {
        await processInventoryBatchMock(batchId, records);
      } else if (type === 'TRANSACTION') {
        await processTransactionBatchMock(batchId, records);
      } else if (type === 'REVIEW') {
        await processReviewBatchMock(batchId, records);
      }

      const batch = mockStore.batches.find(b => b.id === batchId);
      mockStore.updateBatch(batchId, {
        status: 'COMPLETED',
        recordCount: records.length,
      });

      return batch
        ? { ...batch, status: 'COMPLETED', recordCount: records.length }
        : ({} as ImportBatch);
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
    if (!records || records.length === 0) {
      throw new Error('CSV 内容为空或格式错误');
    }

    if (type === 'INVENTORY') {
      await processInventoryBatchPrisma(batchId, records);
    } else if (type === 'TRANSACTION') {
      await processTransactionBatchPrisma(batchId, records);
    } else if (type === 'REVIEW') {
      await processReviewBatchPrisma(batchId, records);
    }

    const batch = await prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'COMPLETED', recordCount: records.length },
    });
    return normalizeBatch(batch);
  } catch (error: any) {
    await prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'FAILED', errorMessage: error.message },
    });
    throw error;
  }
}

async function processInventoryBatchMock(batchId: string, records: any[]): Promise<void> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  if (technicians.length === 0) throw new Error('没有技师用户，请先创建技师账号');

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const invId = `inv-${batchId}-${i}`;
    const inv: any = {
      id: invId,
      batchId,
      skuCode: r.sku_code || r.skuCode || `SKU-${Date.now()}-${i}`,
      productName: r.product_name || r.productName || `产品${i + 1}`,
      category: r.category || '未分类',
      unit: r.unit || '个',
      stockQuantity: parseFloat(r.stock_quantity || r.stockQuantity || '0'),
      unitPrice: parseFloat(r.unit_price || r.unitPrice || '0'),
      importedAt: new Date(),
    };
    mockStore.addInventories([inv]);

    const tech = technicians[i % technicians.length];
    const handNo = `H${Date.now()}${i}`.toUpperCase();
    const order: any = {
      id: `order-${invId}`,
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

    mockStore.addInventoryUsage({
      id: `usage-${invId}`,
      orderId: order.id,
      inventoryId: inv.id,
      quantity: Math.min(inv.stockQuantity, 1),
      isAbnormal: false,
      inventory: inv,
    });
  }
}

async function processTransactionBatchMock(batchId: string, records: any[]): Promise<void> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  if (technicians.length === 0) throw new Error('没有技师用户，请先创建技师账号');

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const techId = r.technician_id || r.technicianId || technicians[i % technicians.length].id;
    const tech = mockStore.getUserById(techId) || technicians[0];
    const trans: any = {
      id: `trans-${batchId}-${i}`,
      batchId,
      orderNo: r.order_no || r.orderNo || `ORD-${Date.now()}-${i}`,
      handNo: r.hand_no || r.handNo || `H${Date.now()}${i}`,
      technicianId: techId,
      serviceItem: r.service_item || r.serviceItem || '常规服务',
      amount: parseFloat(r.amount || '0'),
      paymentMethod: r.payment_method || r.paymentMethod || '微信',
      transactionTime: new Date(r.transaction_time || r.transactionTime || Date.now()),
      status: 'PAID',
      technician: tech,
    };
    mockStore.addTransactions([trans]);

    const existingOrder = mockStore.orders.find(o => o.handNo === trans.handNo);
    if (existingOrder) {
      const newTotal = (existingOrder.transactions || []).reduce((s: number, t: any) => s + t.amount, 0) + trans.amount;
      mockStore.updateOrderByHandNo(trans.handNo, {
        status: 'PAID',
        totalAmount: newTotal,
        serviceItems: [...(existingOrder.serviceItems || []), trans.serviceItem],
        completedAt: trans.transactionTime,
        transactions: [...(existingOrder.transactions || []), trans],
      });
    } else {
      mockStore.upsertOrder({
        id: `order-${trans.id}`,
        handNo: trans.handNo,
        technicianId: techId,
        serviceItems: [trans.serviceItem],
        totalAmount: trans.amount,
        status: 'PAID',
        createdAt: trans.transactionTime,
        completedAt: trans.transactionTime,
        technician: tech,
        transactions: [trans],
        inventoryItems: [],
      } as any);
    }
  }
}

async function processReviewBatchMock(batchId: string, records: any[]): Promise<void> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  if (technicians.length === 0) throw new Error('没有技师用户，请先创建技师账号');

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1;
    const review: any = {
      id: `review-${batchId}-${i}`,
      batchId,
      orderNo: r.order_no || r.orderNo || `ORD-${Date.now()}-${i}`,
      rating: parseInt(r.rating || '5', 10),
      content: r.content || null,
      hasBeforePhoto: toBool(r.has_before_photo || r.hasBeforePhoto),
      hasAfterPhoto: toBool(r.has_after_photo || r.hasAfterPhoto),
      followUpScript: r.follow_up_script || r.followUpScript || null,
      responded: toBool(r.responded),
      reviewedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
    };
    mockStore.addReviews([review]);

    const matchedTrans = mockStore.transactions.find(t => t.orderNo === review.orderNo);
    if (matchedTrans) {
      mockStore.updateOrderByHandNo(matchedTrans.handNo, {
        status: 'REVIEWED',
        review,
      });
    } else {
      const tech = technicians[i % technicians.length];
      const handNo = `H-REV-${Date.now()}${i}`.toUpperCase();
      mockStore.upsertOrder({
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
        inventoryItems: [],
      } as any);
    }
  }
}

async function processInventoryBatchPrisma(batchId: string, records: any[]): Promise<void> {
  const { prisma, Prisma } = await import('@/lib/prisma');
  const technicians = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  if (technicians.length === 0) throw new Error('没有技师用户，请先创建技师账号');

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const skuCode = r.sku_code || r.skuCode || `SKU-${Date.now()}-${i}`;
    const productName = r.product_name || r.productName || `产品${i + 1}`;
    const category = r.category || '未分类';
    const unit = r.unit || '个';
    const stockQty = new Prisma.Decimal(parseFloat(r.stock_quantity || r.stockQuantity || '0'));
    const unitPrice = new Prisma.Decimal(parseFloat(r.unit_price || r.unitPrice || '0'));

    await prisma.$transaction(async (tx: any) => {
      const inventory = await tx.inventory.create({
        data: {
          batchId,
          skuCode,
          productName,
          category,
          unit,
          stockQuantity: stockQty,
          unitPrice,
        },
      });

      const tech = technicians[i % technicians.length];
      const handNo = `H${Date.now()}${i}`.toUpperCase();

      await tx.handOrder.upsert({
        where: { handNo },
        update: {},
        create: {
          handNo,
          technicianId: tech.id,
          serviceItems: [productName],
          totalAmount: unitPrice,
          status: 'CREATED',
        },
      });

      const order = await tx.handOrder.findUnique({ where: { handNo } });
      if (order) {
        await tx.inventoryUsage.create({
          data: {
            orderId: order.id,
            inventoryId: inventory.id,
            quantity: new Prisma.Decimal(Math.min(parseFloat(r.stock_quantity || r.stockQuantity || '1'), 1)),
            isAbnormal: false,
          },
        });
      }
    });
  }
}

async function processTransactionBatchPrisma(batchId: string, records: any[]): Promise<void> {
  const { prisma, Prisma } = await import('@/lib/prisma');
  const technicians = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  if (technicians.length === 0) throw new Error('没有技师用户，请先创建技师账号');

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const techId = r.technician_id || r.technicianId || technicians[i % technicians.length].id;
    const orderNo = r.order_no || r.orderNo || `ORD-${Date.now()}-${i}`;
    const handNo = r.hand_no || r.handNo || `H${Date.now()}${i}`;
    const serviceItem = r.service_item || r.serviceItem || '常规服务';
    const amount = new Prisma.Decimal(parseFloat(r.amount || '0'));
    const paymentMethod = r.payment_method || r.paymentMethod || '微信';
    const transactionTime = new Date(r.transaction_time || r.transactionTime || Date.now());

    await prisma.$transaction(async (tx: any) => {
      await tx.transaction.upsert({
        where: { orderNo },
        update: {
          handNo,
          technicianId: techId,
          serviceItem,
          amount,
          paymentMethod,
          transactionTime,
          status: 'PAID',
        },
        create: {
          batchId,
          orderNo,
          handNo,
          technicianId: techId,
          serviceItem,
          amount,
          paymentMethod,
          transactionTime,
          status: 'PAID',
        },
      });

      const existing = await tx.handOrder.findUnique({
        where: { handNo },
        include: { transactions: true },
      });

      if (existing) {
        const prevTotal = existing.transactions.reduce(
          (s: number, t: any) => s + t.amount.toNumber(),
          0
        );
        await tx.handOrder.update({
          where: { handNo },
          data: {
            status: 'PAID',
            totalAmount: new Prisma.Decimal(prevTotal + parseFloat(r.amount || '0')),
            serviceItems: [...(existing.serviceItems || []), serviceItem],
            completedAt: transactionTime,
          },
        });
      } else {
        await tx.handOrder.create({
          data: {
            handNo,
            technicianId: techId,
            serviceItems: [serviceItem],
            totalAmount: amount,
            status: 'PAID',
            completedAt: transactionTime,
          },
        });
      }
    });
  }
}

async function processReviewBatchPrisma(batchId: string, records: any[]): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  const technicians = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  if (technicians.length === 0) throw new Error('没有技师用户，请先创建技师账号');

  const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const orderNo = r.order_no || r.orderNo || `ORD-${Date.now()}-${i}`;

    await prisma.$transaction(async (tx: any) => {
      await tx.review.upsert({
        where: { orderNo },
        update: {
          rating: parseInt(r.rating || '5', 10),
          content: r.content || null,
          hasBeforePhoto: toBool(r.has_before_photo || r.hasBeforePhoto),
          hasAfterPhoto: toBool(r.has_after_photo || r.hasAfterPhoto),
          followUpScript: r.follow_up_script || r.followUpScript || null,
          responded: toBool(r.responded),
          reviewedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
        },
        create: {
          batchId,
          orderNo,
          rating: parseInt(r.rating || '5', 10),
          content: r.content || null,
          hasBeforePhoto: toBool(r.has_before_photo || r.hasBeforePhoto),
          hasAfterPhoto: toBool(r.has_after_photo || r.hasAfterPhoto),
          followUpScript: r.follow_up_script || r.followUpScript || null,
          responded: toBool(r.responded),
          reviewedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
        },
      });

      const matchedTrans = await tx.transaction.findUnique({ where: { orderNo } });
      if (matchedTrans) {
        await tx.handOrder.update({
          where: { handNo: matchedTrans.handNo },
          data: { status: 'REVIEWED' },
        });
      } else {
        const tech = technicians[i % technicians.length];
        const handNo = `H-REV-${Date.now()}${i}`.toUpperCase();
        await tx.handOrder.create({
          data: {
            handNo,
            technicianId: tech.id,
            serviceItems: ['服务项目'],
            status: 'REVIEWED',
            completedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
          },
        });
      }
    });
  }
}

function normalizeBatch(raw: any): ImportBatch {
  return {
    id: raw.id,
    batchNo: raw.batchNo,
    type: raw.type,
    fileName: raw.fileName,
    recordCount: raw.recordCount,
    importedBy: raw.importedBy,
    importedAt: raw.importedAt,
    status: raw.status,
    errorMessage: raw.errorMessage ?? undefined,
  };
}

export async function getImportBatches(
  type?: BatchType,
  page = 1,
  pageSize = 10
): Promise<{ batches: ImportBatch[]; total: number }> {
  if (CONFIG.USE_MOCK) {
    const filtered = type
      ? mockStore.batches.filter(b => b.type === type)
      : mockStore.batches;
    return {
      batches: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
    };
  }

  const { prisma } = await import('@/lib/prisma');
  const where = type ? { type } : {};
  const [rawBatches, total] = await Promise.all([
    prisma.importBatch.findMany({
      where,
      include: { importer: true },
      orderBy: { importedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.importBatch.count({ where }),
  ]);
  return { batches: rawBatches.map(normalizeBatch), total };
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
