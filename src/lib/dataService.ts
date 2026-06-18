import { FunnelStage, AnomalyType, Severity, AnomalyStatus, SyncStatus, SyncTaskType } from "./constants";
import {
  MOCK_SITES,
  MOCK_MATERIALS,
  MOCK_ARRIVALS,
  MOCK_ANOMALIES,
  MOCK_SYNC_TASKS,
  MOCK_SAFETY_STOCKS,
  MOCK_INVENTORY_RECORDS,
  MOCK_STOCK_COUNT_DIFFS,
  MOCK_RAW_SAMPLES,
  MOCK_NOTES,
  MOCK_SUPERVISOR_PHOTOS,
  MOCK_PAYMENT_RECORDS,
  MOCK_PURCHASE_ORDERS,
  MockMaterialArrival,
  MockAnomaly,
  MockNote,
  MockSupervisorPhoto,
  MockPaymentRecord,
  MockPurchaseOrder,
  MockSyncTask,
} from "./mockData";
import { STAGE_ORDER, STAGE_LABELS, CALIBER_VERSION, SYNC_TASK_LABELS, ANOMALY_TYPE_LABELS } from "./constants";

const DB_CONFIG_ERROR = `PostgreSQL/Supabase 未配置或连接失败，请在项目根目录创建 .env 文件并配置 DATABASE_URL，然后执行 npx prisma db push && npx prisma seed。同步异常和任务状态必须持久化写入数据库。`;

let prismaClient: any = null;
let prismaChecked = false;
let prismaAvailable = false;

async function getPrisma(strict = false): Promise<any> {
  if (prismaChecked) {
    if (prismaAvailable) return prismaClient;
    if (strict) throw new Error(DB_CONFIG_ERROR);
    return null as any;
  }
  try {
    const { prisma } = await import("./prisma");
    await prisma.$queryRaw`SELECT 1`;
    prismaClient = prisma;
    prismaAvailable = true;
  } catch (e: any) {
    prismaAvailable = false;
    if (strict) {
      throw new Error(`${DB_CONFIG_ERROR}\n原始错误: ${e.message || String(e)}`);
    }
  }
  prismaChecked = true;
  if (prismaAvailable) return prismaClient;
  if (strict) throw new Error(DB_CONFIG_ERROR);
  return null as any;
}

function normalizeAnomaly(item: any): MockAnomaly {
  return {
    id: item.id,
    anomalyType: item.anomalyType as AnomalyType,
    severity: item.severity as Severity,
    siteId: item.siteId,
    arrivalId: item.arrivalId || null,
    title: item.title,
    description: item.description,
    status: item.status as AnomalyStatus,
    assignee: item.assignee || null,
    createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
  };
}

export interface FunnelFilters {
  siteId?: string;
  materialCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  caliberVersion?: string;
}

export interface FunnelStageData {
  stage: FunnelStage;
  label: string;
  value: number;
  count: number;
  shortageQty: number;
  shortageCount: number;
  avgTurnoverDays: number;
  conversionRate: number;
}

export async function getFunnelData(filters: FunnelFilters = {}) {
  const prisma = await getPrisma(true);

  const where: any = {};
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.caliberVersion) where.caliberVersion = filters.caliberVersion;
  if (filters.dateFrom || filters.dateTo) {
    where.plannedDate = {};
    if (filters.dateFrom) where.plannedDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.plannedDate.lte = new Date(filters.dateTo);
  }

  if (filters.materialCategory) {
    const materials = await prisma.material.findMany({
      where: { category: filters.materialCategory },
      select: { id: true },
    });
    where.materialId = { in: materials.map((m: any) => m.id) };
  }

  const arrivals = await prisma.materialArrival.findMany({
    where,
    include: { material: true },
  });

  const stages: FunnelStageData[] = STAGE_ORDER.map((stage, idx) => {
    const stageIdx = STAGE_ORDER.indexOf(stage);
    const stageArrivals = arrivals.filter((a: any) => {
      const aIdx = STAGE_ORDER.indexOf(a.stage);
      return aIdx >= stageIdx;
    });
    const qtySum = stageArrivals.reduce(
      (s: number, a: any) => s + (stageIdx === 0 ? Number(a.plannedQty) : Number(a.actualQty || 0)),
      0
    );
    const shortageArrivals = stageArrivals.filter((a: any) => a.hasShortage);
    const validTurnover = stageArrivals.filter((a: any) => a.turnoverDays !== null);

    const prevStage = idx > 0 ? STAGE_ORDER[idx - 1] : null;
    let prevQty = 0;
    if (prevStage) {
      const prevIdx = STAGE_ORDER.indexOf(prevStage);
      const prevArrivals = arrivals.filter((a: any) => {
        const aIdx = STAGE_ORDER.indexOf(a.stage);
        return aIdx >= prevIdx;
      });
      prevQty = prevArrivals.reduce(
        (s: number, a: any) => s + (prevIdx === 0 ? Number(a.plannedQty) : Number(a.actualQty || 0)),
        0
      );
    }

    return {
      stage,
      label: STAGE_LABELS[stage],
      value: qtySum,
      count: stageArrivals.length,
      shortageQty: shortageArrivals.reduce((s: number, a: any) => s + Number(a.shortageQty), 0),
      shortageCount: shortageArrivals.length,
      avgTurnoverDays:
        validTurnover.length > 0
          ? Math.round(
              (validTurnover.reduce((s: number, a: any) => s + Number(a.turnoverDays), 0) /
                validTurnover.length) *
                10
            ) / 10
          : 0,
      conversionRate: prevQty > 0 ? Math.round((qtySum / prevQty) * 1000) / 10 : 100,
    };
  });

  return {
    stages,
    filters: {
      ...filters,
      caliberVersion: filters.caliberVersion || CALIBER_VERSION,
    },
    totalPlanned: stages[0]?.value || 0,
    totalCompleted: stages[stages.length - 1]?.value || 0,
    overallConversion:
      stages[0]?.value > 0
        ? Math.round((stages[stages.length - 1].value / stages[0].value) * 1000) / 10
        : 0,
    totalShortage: stages.reduce((s, st) => s + st.shortageQty, 0),
  };
}

export async function getSites() {
  const prisma = await getPrisma(true);
  return prisma.constructionSite.findMany({
    orderBy: { projectNo: "asc" },
  });
}

export async function getMaterials() {
  const prisma = await getPrisma(true);
  return prisma.material.findMany({
    orderBy: { code: "asc" },
  });
}

export async function getMaterialCategories() {
  const prisma = await getPrisma(true);
  const materials = await prisma.material.findMany({
    select: { category: true },
    distinct: ["category"],
  });
  return materials.map((m: any) => m.category);
}

export async function getSyncTasks() {
  const prisma = await getPrisma(true);
  const tasks = await prisma.syncTask.findMany({
    orderBy: { createdAt: "asc" },
  });
  return tasks.map((t: any) => ({
    id: t.id,
    taskType: t.taskType,
    status: t.status,
    totalCount: t.totalCount,
    successCount: t.successCount,
    failedCount: t.failedCount,
    lastRun: t.finishedAt || t.updatedAt,
  }));
}

export interface AnomalyFilters {
  siteId?: string;
  anomalyType?: string;
  status?: string;
  severity?: string;
}

export async function getAnomalies(filters: AnomalyFilters = {}) {
  const prisma = await getPrisma(true);
  const where: any = {};
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.anomalyType) where.anomalyType = filters.anomalyType;
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;

  const anomalies = await prisma.anomalyItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      site: { select: { name: true, projectNo: true } },
      arrival: {
        select: {
          batchNo: true,
          material: { select: { name: true } },
        },
      },
    },
  });

  return anomalies.map((a: any) => ({
    id: a.id,
    anomalyType: a.anomalyType,
    severity: a.severity,
    siteId: a.siteId,
    arrivalId: a.arrivalId,
    photoId: a.photoId,
    paymentId: a.paymentId,
    orderId: a.orderId,
    title: a.title,
    description: a.description,
    status: a.status,
    assignee: a.assignee,
    createdAt: a.createdAt,
    siteName: a.site?.name,
    projectNo: a.site?.projectNo,
    materialName: a.arrival?.material?.name,
    batchNo: a.arrival?.batchNo,
  }));
}

function enrichAnomaly(a: MockAnomaly) {
  const site = MOCK_SITES.find((s) => s.id === a.siteId);
  const arrival = a.arrivalId ? MOCK_ARRIVALS.find((x) => x.id === a.arrivalId) : null;
  const material = arrival ? MOCK_MATERIALS.find((m) => m.id === arrival.materialId) : null;
  return {
    ...a,
    siteName: site?.name,
    projectNo: site?.projectNo,
    materialName: material?.name,
    batchNo: arrival?.batchNo,
  };
}

export async function getSafetyStocks(siteId?: string) {
  const prisma = await getPrisma(true);
  const where: any = {};
  if (siteId) where.siteId = siteId;
  const stocks = await prisma.safetyStock.findMany({
    where,
    include: { material: true },
  });
  return stocks.map((s: any) => ({
    ...s,
    materialName: s.material?.name,
    materialCode: s.material?.code,
    unit: s.material?.unit,
    status:
      Number(s.currentStock) < Number(s.minQty)
        ? "不足"
        : Number(s.currentStock) > Number(s.maxQty)
          ? "过高"
          : "正常",
  }));
}

export async function getInventoryRecords(siteId?: string, materialId?: string, limit = 50) {
  const prisma = await getPrisma(true);
  const where: any = {};
  if (siteId) where.siteId = siteId;
  if (materialId) where.materialId = materialId;
  const records = await prisma.inventoryRecord.findMany({
    where,
    take: limit,
    orderBy: { occurredAt: "desc" },
    include: { material: true, site: true },
  });
  return records.map((r: any) => ({
    ...r,
    materialName: r.material?.name,
    unit: r.material?.unit,
    siteName: r.site?.name,
  }));
}

export async function getStockCountDiffs(siteId?: string) {
  const prisma = await getPrisma(true);
  const where: any = {};
  if (siteId) where.siteId = siteId;
  const diffs = await prisma.stockCountDiff.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { material: true, site: true, rawSamples: true },
  });
  return diffs.map((d: any) => ({
    ...d,
    materialName: d.material?.name,
    unit: d.material?.unit,
    siteName: d.site?.name,
    hasRawSample: (d.rawSamples?.length || 0) > 0,
  }));
}

export async function getRawSamples(diffId: string) {
  const prisma = await getPrisma(true);
  return prisma.rawSample.findMany({
    where: { diffId },
    orderBy: { capturedAt: "asc" },
  });
}

export async function getStockDiffDrilldown(diffId: string) {
  const prisma = await getPrisma(true);
  const diff = await prisma.stockCountDiff.findFirst({
    where: { id: diffId },
    include: { material: true },
  });
  if (!diff) return null;

  const [safety, inventory, samples, notes] = await Promise.all([
    prisma.safetyStock.findFirst({
      where: { materialId: diff.materialId, siteId: diff.siteId },
      include: { material: true },
    }),
    prisma.inventoryRecord.findMany({
      where: { siteId: diff.siteId, materialId: diff.materialId },
      take: 20,
      orderBy: { occurredAt: "desc" },
      include: { material: true, site: true },
    }),
    prisma.rawSample.findMany({ where: { diffId }, orderBy: { capturedAt: "asc" } }),
    prisma.note.findMany({
      where: { stockDiffId: diffId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    diff: {
      ...diff,
      materialName: diff.material?.name,
      materialCode: diff.material?.code,
      unit: diff.material?.unit,
      standardDays: diff.material?.standardDays,
    },
    safetyStock: safety
      ? {
          ...safety,
          materialName: safety.material?.name,
          materialCode: safety.material?.code,
          unit: safety.material?.unit,
          status:
            Number(safety.currentStock) < Number(safety.minQty)
              ? "不足"
              : Number(safety.currentStock) > Number(safety.maxQty)
                ? "过高"
                : "正常",
        }
      : null,
    inventoryRecords: inventory.map((r: any) => ({
      ...r,
      materialName: r.material?.name,
      unit: r.material?.unit,
      siteName: r.site?.name,
    })),
    rawSamples: samples,
    notes,
  };
}

export async function getNotes(filters: { siteId?: string; stockDiffId?: string } = {}) {
  const prisma = await getPrisma(true);
  const where: any = {};
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.stockDiffId) where.stockDiffId = filters.stockDiffId;
  return prisma.note.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function addNote(input: {
  content: string;
  author: string;
  siteId: string;
  stockDiffId?: string | null;
}) {
  const prisma = await getPrisma(true);
  return prisma.note.create({
    data: {
      content: input.content,
      author: input.author,
      siteId: input.siteId,
      stockDiffId: input.stockDiffId || undefined,
    },
  });
}

export interface ExportParams {
  siteId?: string;
  materialCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  caliberVersion: string;
}

export async function buildExportData(params: ExportParams) {
  const prisma = await getPrisma(true);
  const funnel = await getFunnelData(params);

  const where: any = {};
  if (params.siteId) where.siteId = params.siteId;
  if (params.caliberVersion) where.caliberVersion = params.caliberVersion;
  if (params.dateFrom || params.dateTo) {
    where.plannedDate = {};
    if (params.dateFrom) where.plannedDate.gte = new Date(params.dateFrom);
    if (params.dateTo) where.plannedDate.lte = new Date(params.dateTo);
  }
  if (params.materialCategory) {
    const materials = await prisma.material.findMany({
      where: { category: params.materialCategory },
      select: { id: true },
    });
    where.materialId = { in: materials.map((m: any) => m.id) };
  }

  const arrivals = await prisma.materialArrival.findMany({
    where,
    include: { site: true, material: true },
    orderBy: { plannedDate: "desc" },
  });

  const rows = arrivals.map((a: any) => ({
    项目编号: a.site?.projectNo,
    工地名称: a.site?.name,
    材料名称: a.material?.name,
    材料编码: a.material?.code,
    批次号: a.batchNo,
    当前阶段: funnel.stages.find((s) => s.stage === a.stage)?.label,
    状态: a.status,
    计划数量: Number(a.plannedQty),
    实际数量: Number(a.actualQty || 0),
    单位: a.material?.unit,
    是否短缺: a.hasShortage ? "是" : "否",
    短缺数量: Number(a.shortageQty),
    计划日期: a.plannedDate.toISOString().slice(0, 10),
    实际日期: a.actualDate ? a.actualDate.toISOString().slice(0, 10) : "",
    周转天数: a.turnoverDays !== null ? Number(a.turnoverDays) : "未完成",
    标准周转天数: a.material?.standardDays,
    采购单号: a.purchaseRef,
    验收人: a.inspector,
    口径版本: a.caliberVersion,
  }));

  return {
    meta: {
      exportTime: new Date().toISOString(),
      caliberVersion: params.caliberVersion,
      filters: {
        siteId: params.siteId || "全部",
        materialCategory: params.materialCategory || "全部",
        dateFrom: params.dateFrom || "不限",
        dateTo: params.dateTo || "不限",
      },
      funnelSummary: funnel.stages.map((s) => ({
        阶段: s.label,
        数量: s.value,
        批次: s.count,
        短缺数量: s.shortageQty,
        短缺批次数: s.shortageCount,
        平均周转天数: s.avgTurnoverDays,
        转化率: `${s.conversionRate}%`,
      })),
    },
    arrivals: rows,
  };
}

export async function getArrivals(filters: FunnelFilters = {}) {
  const prisma = await getPrisma(true);
  const where: any = {};
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.caliberVersion) where.caliberVersion = filters.caliberVersion;
  if (filters.dateFrom || filters.dateTo) {
    where.plannedDate = {};
    if (filters.dateFrom) where.plannedDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.plannedDate.lte = new Date(filters.dateTo);
  }
  const arrivals = await prisma.materialArrival.findMany({
    where,
    include: { site: true, material: true },
    orderBy: { plannedDate: "desc" },
  });
  return arrivals.map((a: any) => ({
    ...a,
    siteName: a.site?.name,
    materialName: a.material?.name,
    unit: a.material?.unit,
  }));
}

export interface SyncExecuteResult {
  task: MockSyncTask;
  createdAnomalies: MockAnomaly[];
  failedItems: Array<{
    id: string;
    type: string;
    siteId: string;
    description: string;
    error: string;
  }>;
}

let anomalyIdCounter = 1000;

interface SyncSourceInfo {
  sourceModel: string;
  mockSource: Array<any>;
  anomalyType: AnomalyType;
  labelField: string;
  idField: "photoId" | "paymentId" | "orderId";
  extraFields: string[];
}

function getSyncSourceInfo(taskType: string): SyncSourceInfo {
  switch (taskType) {
    case "SUPERVISOR_PHOTO":
      return {
        sourceModel: "supervisorPhoto",
        mockSource: MOCK_SUPERVISOR_PHOTOS,
        anomalyType: AnomalyType.PHOTO_MISSING,
        labelField: "fileName",
        idField: "photoId",
        extraFields: ["photoType", "photoUrl", "takenAt", "uploader", "remark"],
      };
    case "PAYMENT_RECORD":
      return {
        sourceModel: "paymentRecord",
        mockSource: MOCK_PAYMENT_RECORDS,
        anomalyType: AnomalyType.PAYMENT_MISMATCH,
        labelField: "voucherNo",
        idField: "paymentId",
        extraFields: ["amount", "paymentType", "payer", "payee", "paidAt", "purchaseOrderId"],
      };
    case "PURCHASE_ORDER":
      return {
        sourceModel: "purchaseOrder",
        mockSource: MOCK_PURCHASE_ORDERS,
        anomalyType: AnomalyType.ORDER_MISSING,
        labelField: "orderNo",
        idField: "orderId",
        extraFields: ["supplier", "totalAmount", "status", "orderedAt"],
      };
    default:
      return {
        sourceModel: "",
        mockSource: [],
        anomalyType: AnomalyType.OTHER,
        labelField: "id",
        idField: "orderId",
        extraFields: [],
      };
  }
}

function buildSourceDetailSnapshot(item: any, info: SyncSourceInfo): string {
  const parts: string[] = [];
  parts.push(`${info.labelField}: ${item[info.labelField] || item.id}`);
  info.extraFields.forEach((f) => {
    if (item[f] !== undefined && item[f] !== null) {
      let val = item[f];
      if (val instanceof Date) val = val.toISOString();
      if (typeof val === "string" && val.length > 80) val = val.slice(0, 80) + "...";
      parts.push(`${f}: ${String(val)}`);
    }
  });
  parts.push(`syncError: ${item.syncError || "(未记录)"}`);
  return parts.join(" | ");
}

export async function executeSyncTask(taskType: SyncTaskType | "ALL"): Promise<{
  results: SyncExecuteResult[];
  totalAnomaliesCreated: number;
}> {
  const prisma = await getPrisma(true);
  const taskTypes = taskType === "ALL"
    ? [SyncTaskType.SUPERVISOR_PHOTO, SyncTaskType.PAYMENT_RECORD, SyncTaskType.PURCHASE_ORDER]
    : [taskType];

  const results: SyncExecuteResult[] = [];
  let totalAnomaliesCreated = 0;

  for (const tt of taskTypes) {
    const info = getSyncSourceInfo(tt);

    let task = await prisma.syncTask.findFirst({
      where: { taskType: tt },
    });
    if (!task) {
      task = await prisma.syncTask.create({
        data: {
          taskType: tt,
          status: SyncStatus.NOT_SYNCED,
          totalCount: 0,
          successCount: 0,
          failedCount: 0,
        },
      });
    }

    await prisma.syncTask.update({
      where: { id: task.id },
      data: { status: SyncStatus.SYNCING, startedAt: new Date() },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    let failedItems: any[] = [];
    let totalCount = 0;
    try {
      failedItems = await prisma[info.sourceModel].findMany({
        where: { syncStatus: SyncStatus.FAILED },
      });
      totalCount = await prisma[info.sourceModel].count();
    } catch {
      failedItems = info.mockSource.filter((x: any) => x.syncStatus === SyncStatus.FAILED);
      totalCount = info.mockSource.length;

      const sites = await prisma.constructionSite.findMany({ select: { id: true } });
      const siteIdMap = new Map<string, string>();
      for (let i = 0; i < Math.min(sites.length, MOCK_SITES.length); i++) {
        siteIdMap.set(MOCK_SITES[i].id, sites[i].id);
      }

      for (const item of failedItems) {
        item.siteId = siteIdMap.get(item.siteId) || (sites[0]?.id ?? item.siteId);
      }
    }
    const successCount = totalCount - failedItems.length;

    const createdAnomalies: MockAnomaly[] = [];

    for (const failedItem of failedItems) {
      const existingAnomaly = await prisma.anomalyItem.findFirst({
        where: {
          anomalyType: info.anomalyType,
          [info.idField]: failedItem.id,
        },
      });

      if (existingAnomaly) {
        if (existingAnomaly.status === AnomalyStatus.RESOLVED) {
          const updated = await prisma.anomalyItem.update({
            where: { id: existingAnomaly.id },
            data: {
              status: AnomalyStatus.OPEN,
              createdAt: new Date(),
              description: `${info.labelField ? failedItem[info.labelField] || failedItem.id : failedItem.id} 同步失败，错误原因：${failedItem.syncError || "未知错误"}。【源数据快照】${buildSourceDetailSnapshot(failedItem, info)}`,
            },
          });
          createdAnomalies.push(normalizeAnomaly(updated));
        } else {
          const touched = await prisma.anomalyItem.update({
            where: { id: existingAnomaly.id },
            data: {
              description: `${info.labelField ? failedItem[info.labelField] || failedItem.id : failedItem.id} 同步失败，错误原因：${failedItem.syncError || "未知错误"}。【源数据快照】${buildSourceDetailSnapshot(failedItem, info)}`,
            },
          });
        }
        continue;
      }

      const siteId = failedItem.siteId;
      if (!siteId) continue;

      const anomalyData: any = {
        anomalyType: info.anomalyType,
        severity: failedItems.length > 5 ? Severity.HIGH : Severity.MEDIUM,
        siteId,
        title: `${SYNC_TASK_LABELS[tt]}同步失败 - ${failedItem[info.labelField] || failedItem.id}`,
        description: `${info.labelField ? failedItem[info.labelField] || failedItem.id : failedItem.id} 同步失败，错误原因：${failedItem.syncError || "未知错误"}。【源数据快照】${buildSourceDetailSnapshot(failedItem, info)}`,
        status: AnomalyStatus.OPEN,
        caliberUsed: CALIBER_VERSION,
        [info.idField]: failedItem.id,
      };

      try {
        const newAnomaly = await prisma.anomalyItem.create({ data: anomalyData });
        createdAnomalies.push(normalizeAnomaly(newAnomaly));
      } catch (e: any) {
        anomalyData.siteId = (await prisma.constructionSite.findFirst({ select: { id: true } }))?.id;
        if (!anomalyData.siteId) throw e;
        const newAnomaly = await prisma.anomalyItem.create({ data: anomalyData });
        createdAnomalies.push(normalizeAnomaly(newAnomaly));
      }
    }

    const updatedTask = await prisma.syncTask.update({
      where: { id: task.id },
      data: {
        status: SyncStatus.SYNCED,
        totalCount,
        successCount,
        failedCount: failedItems.length,
        finishedAt: new Date(),
      },
    });

    totalAnomaliesCreated += createdAnomalies.length;

    results.push({
      task: {
        id: updatedTask.id,
        taskType: updatedTask.taskType,
        status: updatedTask.status,
        totalCount: updatedTask.totalCount,
        successCount: updatedTask.successCount,
        failedCount: updatedTask.failedCount,
        lastRun: updatedTask.finishedAt || updatedTask.updatedAt,
      },
      createdAnomalies,
      failedItems: failedItems.map((fi: any) => ({
        id: fi.id,
        type: tt,
        siteId: fi.siteId,
        description: info.labelField ? fi[info.labelField] || fi.id : fi.id,
        error: fi.syncError || "未知错误",
      })),
    });
  }

  return { results, totalAnomaliesCreated };
}

export function getSupervisorPhotos(siteId?: string) {
  let list = MOCK_SUPERVISOR_PHOTOS;
  if (siteId) list = list.filter((p) => p.siteId === siteId);
  return list.map((p) => ({
    ...p,
    siteName: MOCK_SITES.find((s) => s.id === p.siteId)?.name,
  }));
}

export function getPaymentRecords(siteId?: string) {
  let list = MOCK_PAYMENT_RECORDS;
  if (siteId) list = list.filter((p) => p.siteId === siteId);
  return list.map((p) => ({
    ...p,
    siteName: MOCK_SITES.find((s) => s.id === p.siteId)?.name,
  }));
}

export function getPurchaseOrders(siteId?: string) {
  let list = MOCK_PURCHASE_ORDERS;
  if (siteId) list = list.filter((p) => p.siteId === siteId);
  return list.map((p) => ({
    ...p,
    siteName: MOCK_SITES.find((s) => s.id === p.siteId)?.name,
  }));
}
