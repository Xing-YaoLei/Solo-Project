import { generateBatchNo } from '@/utils/format';
import { BatchType, ImportBatch } from '@/types';
import { mockStore } from './mockStore';
import Papa from 'papaparse';
import { CONFIG } from './config';

interface ProcessResult {
  total: number;
  success: number;
  skipped: number;
  skippedReasons: string[];
}

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
  const parsed = (Papa.parse as any)(fileContent, { header: true, skipEmptyLines: true });
  const records = (parsed.data || []) as any[];
  if (!records || records.length === 0) {
    throw new Error('CSV 内容为空或格式错误');
  }

  let result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };

  if (CONFIG.USE_MOCK) {
    mockStore.updateBatch(batchId, { status: 'PROCESSING' });
    try {
      if (type === 'INVENTORY') result = await processInventoryBatchMock(batchId, records);
      else if (type === 'TRANSACTION') result = await processTransactionBatchMock(batchId, records);
      else if (type === 'REVIEW') result = await processReviewBatchMock(batchId, records);

      const errorMessage = buildResultMessage(result);
      mockStore.updateBatch(batchId, {
        status: result.success > 0 ? 'COMPLETED' : 'FAILED',
        recordCount: result.success,
        errorMessage,
      });
      const batch = mockStore.batches.find(b => b.id === batchId);
      return batch
        ? { ...batch, status: result.success > 0 ? 'COMPLETED' : 'FAILED', recordCount: result.success, errorMessage }
        : ({} as ImportBatch);
    } catch (error: any) {
      mockStore.updateBatch(batchId, { status: 'FAILED', errorMessage: error.message });
      throw error;
    }
  }

  const { prisma } = await import('@/lib/prisma');
  await prisma.importBatch.update({ where: { id: batchId }, data: { status: 'PROCESSING' } });

  try {
    if (type === 'INVENTORY') result = await processInventoryBatchPrisma(batchId, records);
    else if (type === 'TRANSACTION') result = await processTransactionBatchPrisma(batchId, records);
    else if (type === 'REVIEW') result = await processReviewBatchPrisma(batchId, records);

    const errorMessage = buildResultMessage(result);
    const batch = await prisma.importBatch.update({
      where: { id: batchId },
      data: {
        status: result.success > 0 ? 'COMPLETED' : 'FAILED',
        recordCount: result.success,
        errorMessage,
      },
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

function buildResultMessage(result: ProcessResult): string | undefined {
  const parts: string[] = [`总计${result.total}条，成功${result.success}条，跳过${result.skipped}条`];
  if (result.skippedReasons.length > 0) {
    parts.push('跳过原因：' + result.skippedReasons.slice(0, 10).join('；'));
    if (result.skippedReasons.length > 10) parts.push(`等共${result.skippedReasons.length}条记录`);
  }
  return parts.join('；');
}

function mergeResult(base: ProcessResult, delta: ProcessResult): ProcessResult {
  return {
    total: delta.total,
    success: base.success + delta.success,
    skipped: base.skipped + delta.skipped,
    skippedReasons: [...base.skippedReasons, ...delta.skippedReasons],
  };
}

async function processInventoryBatchMock(batchId: string, records: any[]): Promise<ProcessResult> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  const result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };
  if (technicians.length === 0) {
    throw new Error('没有技师用户，请先创建技师账号（运行 db:seed）');
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      const skuCode = r.sku_code || r.skuCode;
      const productName = r.product_name || r.productName;
      if (!skuCode || !productName) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：缺少 skuCode 或 productName`);
        continue;
      }
      const invId = `inv-${batchId}-${i}`;
      const inv: any = {
        id: invId,
        batchId,
        skuCode,
        productName,
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
      result.success++;
    } catch (err: any) {
      result.skipped++;
      result.skippedReasons.push(`第${i + 1}行：${err.message}`);
    }
  }
  return result;
}

async function processTransactionBatchMock(batchId: string, records: any[]): Promise<ProcessResult> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  const result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };
  if (technicians.length === 0) {
    throw new Error('没有技师用户，请先创建技师账号（运行 db:seed）');
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      const orderNo = r.order_no || r.orderNo;
      const handNo = r.hand_no || r.handNo;
      const amount = parseFloat(r.amount);
      if (!orderNo || !handNo || isNaN(amount)) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：缺少 orderNo/handNo/amount`);
        continue;
      }
      const techId = r.technician_id || r.technicianId || technicians[i % technicians.length].id;
      const tech = mockStore.getUserById(techId) || technicians[0];
      const trans: any = {
        id: `trans-${batchId}-${i}`,
        batchId,
        orderNo,
        handNo,
        technicianId: techId,
        serviceItem: r.service_item || r.serviceItem || '常规服务',
        amount,
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
      result.success++;
    } catch (err: any) {
      result.skipped++;
      result.skippedReasons.push(`第${i + 1}行：${err.message}`);
    }
  }
  return result;
}

async function processReviewBatchMock(batchId: string, records: any[]): Promise<ProcessResult> {
  const technicians = mockStore.users.filter(u => u.role === 'TECHNICIAN');
  const result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };
  if (technicians.length === 0) {
    throw new Error('没有技师用户，请先创建技师账号（运行 db:seed）');
  }

  const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      const orderNo = r.order_no || r.orderNo;
      if (!orderNo) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：缺少 orderNo`);
        continue;
      }

      const matchedTrans = mockStore.transactions.find(t => t.orderNo === orderNo);
      if (!matchedTrans) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：orderNo=${orderNo} 无对应收银流水，跳过`);
        continue;
      }

      const review: any = {
        id: `review-${batchId}-${i}`,
        batchId,
        orderNo,
        rating: Math.min(5, Math.max(1, parseInt(r.rating || '5', 10))),
        content: r.content || null,
        hasBeforePhoto: toBool(r.has_before_photo || r.hasBeforePhoto),
        hasAfterPhoto: toBool(r.has_after_photo || r.hasAfterPhoto),
        followUpScript: r.follow_up_script || r.followUpScript || null,
        responded: toBool(r.responded),
        reviewedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
      };
      mockStore.addReviews([review]);

      mockStore.updateOrderByHandNo(matchedTrans.handNo, {
        status: 'REVIEWED',
        review,
      });
      result.success++;
    } catch (err: any) {
      result.skipped++;
      result.skippedReasons.push(`第${i + 1}行：${err.message}`);
    }
  }
  return result;
}

async function processInventoryBatchPrisma(batchId: string, records: any[]): Promise<ProcessResult> {
  const { prisma, Prisma } = await import('@/lib/prisma');
  const technicians = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  const result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };
  if (technicians.length === 0) {
    throw new Error('没有技师用户，请先执行 npm run db:seed 初始化管理层和技师账号');
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      const skuCode = r.sku_code || r.skuCode;
      const productName = r.product_name || r.productName;
      if (!skuCode || !productName) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：缺少 skuCode 或 productName`);
        continue;
      }

      await prisma.$transaction(async (tx: any) => {
        const inventory = await tx.inventory.create({
          data: {
            batchId,
            skuCode,
            productName,
            category: r.category || '未分类',
            unit: r.unit || '个',
            stockQuantity: new Prisma.Decimal(parseFloat(r.stock_quantity || r.stockQuantity || '0')),
            unitPrice: new Prisma.Decimal(parseFloat(r.unit_price || r.unitPrice || '0')),
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
            totalAmount: new Prisma.Decimal(parseFloat(r.unit_price || r.unitPrice || '0')),
            status: 'CREATED',
          },
        });

        const order = await tx.handOrder.findUnique({ where: { handNo } });
        if (order) {
          await tx.inventoryUsage.create({
            data: {
              orderId: order.id,
              inventoryId: inventory.id,
              quantity: new Prisma.Decimal(1),
              isAbnormal: false,
            },
          });
        }
      });
      result.success++;
    } catch (err: any) {
      result.skipped++;
      result.skippedReasons.push(`第${i + 1}行：${err.message}`);
    }
  }
  return result;
}

async function processTransactionBatchPrisma(batchId: string, records: any[]): Promise<ProcessResult> {
  const { prisma, Prisma } = await import('@/lib/prisma');
  const technicians = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  const result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };
  if (technicians.length === 0) {
    throw new Error('没有技师用户，请先执行 npm run db:seed 初始化管理层和技师账号');
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      const orderNo = r.order_no || r.orderNo;
      const handNo = r.hand_no || r.handNo;
      const amount = parseFloat(r.amount);
      if (!orderNo || !handNo || isNaN(amount)) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：缺少 orderNo/handNo/amount 或金额格式错误`);
        continue;
      }
      const techId = r.technician_id || r.technicianId || technicians[i % technicians.length].id;
      const techExists = technicians.find(t => t.id === techId);
      if (!techExists) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：technicianId=${techId} 不存在`);
        continue;
      }
      const serviceItem = r.service_item || r.serviceItem || '常规服务';
      const paymentMethod = r.payment_method || r.paymentMethod || '微信';
      const transactionTime = new Date(r.transaction_time || r.transactionTime || Date.now());

      await prisma.$transaction(async (tx: any) => {
        await tx.transaction.upsert({
          where: { orderNo },
          update: {
            handNo,
            technicianId: techId,
            serviceItem,
            amount: new Prisma.Decimal(amount),
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
            amount: new Prisma.Decimal(amount),
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
              totalAmount: new Prisma.Decimal(prevTotal + amount),
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
              totalAmount: new Prisma.Decimal(amount),
              status: 'PAID',
              completedAt: transactionTime,
            },
          });
        }
      });
      result.success++;
    } catch (err: any) {
      result.skipped++;
      result.skippedReasons.push(`第${i + 1}行：${err.message}`);
    }
  }
  return result;
}

async function processReviewBatchPrisma(batchId: string, records: any[]): Promise<ProcessResult> {
  const { prisma } = await import('@/lib/prisma');
  const technicians = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  const result: ProcessResult = { total: records.length, success: 0, skipped: 0, skippedReasons: [] };
  if (technicians.length === 0) {
    throw new Error('没有技师用户，请先执行 npm run db:seed 初始化管理层和技师账号');
  }

  const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    try {
      const orderNo = r.order_no || r.orderNo;
      if (!orderNo) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：缺少 orderNo`);
        continue;
      }

      const matchedTrans = await prisma.transaction.findUnique({ where: { orderNo } });
      if (!matchedTrans) {
        result.skipped++;
        result.skippedReasons.push(`第${i + 1}行：orderNo=${orderNo} 无对应收银流水，已跳过（需先导入收银流水）`);
        continue;
      }

      const rating = Math.min(5, Math.max(1, parseInt(r.rating || '5', 10)));

      await prisma.$transaction(async (tx: any) => {
        await tx.review.upsert({
          where: { orderNo },
          update: {
            rating,
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
            rating,
            content: r.content || null,
            hasBeforePhoto: toBool(r.has_before_photo || r.hasBeforePhoto),
            hasAfterPhoto: toBool(r.has_after_photo || r.hasAfterPhoto),
            followUpScript: r.follow_up_script || r.followUpScript || null,
            responded: toBool(r.responded),
            reviewedAt: new Date(r.reviewed_at || r.reviewedAt || Date.now()),
          },
        });

        await tx.handOrder.update({
          where: { handNo: matchedTrans.handNo },
          data: { status: 'REVIEWED' },
        });
      });
      result.success++;
    } catch (err: any) {
      result.skipped++;
      result.skippedReasons.push(`第${i + 1}行：${err.message}`);
    }
  }
  return result;
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
        complete: (pResult: Papa.ParseResult<any>) => resolve(pResult.data),
        error: (error: Papa.ParseError) => reject(error),
      });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
