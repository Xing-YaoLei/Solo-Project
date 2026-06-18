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
import { STAGE_ORDER, CALIBER_VERSION, SYNC_TASK_LABELS, ANOMALY_TYPE_LABELS } from "./constants";

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

export function getFunnelData(filters: FunnelFilters = {}) {
  let arrivals = [...MOCK_ARRIVALS];
  if (filters.siteId) arrivals = arrivals.filter((a) => a.siteId === filters.siteId);
  if (filters.materialCategory) {
    const matIds = MOCK_MATERIALS.filter((m) => m.category === filters.materialCategory).map((m) => m.id);
    arrivals = arrivals.filter((a) => matIds.includes(a.materialId));
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    arrivals = arrivals.filter((a) => a.plannedDate >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    arrivals = arrivals.filter((a) => a.plannedDate <= to);
  }

  const stages: FunnelStageData[] = STAGE_ORDER.map((stage, idx) => {
    const stageIdx = STAGE_ORDER.indexOf(stage);
    const stageArrivals = arrivals.filter((a) => {
      const aIdx = STAGE_ORDER.indexOf(a.stage);
      return aIdx >= stageIdx;
    });
    const qtySum = stageArrivals.reduce((s, a) => s + (stageIdx === 0 ? a.plannedQty : a.actualQty || 0), 0);
    const shortageArrivals = stageArrivals.filter((a) => a.hasShortage);
    const validTurnover = stageArrivals.filter((a) => a.turnoverDays !== null) as (MockMaterialArrival & { turnoverDays: number })[];

    const prevStage = idx > 0 ? STAGE_ORDER[idx - 1] : null;
    let prevQty = 0;
    if (prevStage) {
      const prevIdx = STAGE_ORDER.indexOf(prevStage);
      const prevArrivals = arrivals.filter((a) => {
        const aIdx = STAGE_ORDER.indexOf(a.stage);
        return aIdx >= prevIdx;
      });
      prevQty = prevArrivals.reduce((s, a) => s + (prevIdx === 0 ? a.plannedQty : a.actualQty || 0), 0);
    }

    return {
      stage,
      label: STAGE_ORDER[idx] === FunnelStage.DEMAND_PLAN ? "需求计划" :
        STAGE_ORDER[idx] === FunnelStage.PURCHASE_ORDER ? "采购下单" :
        STAGE_ORDER[idx] === FunnelStage.WAREHOUSE_OUT ? "仓库出库" :
        STAGE_ORDER[idx] === FunnelStage.SITE_DELIVERY ? "工地送达" :
        STAGE_ORDER[idx] === FunnelStage.SITE_ACCEPTANCE ? "现场验收" : "实际使用",
      value: qtySum,
      count: stageArrivals.length,
      shortageQty: shortageArrivals.reduce((s, a) => s + a.shortageQty, 0),
      shortageCount: shortageArrivals.length,
      avgTurnoverDays: validTurnover.length > 0
        ? Math.round((validTurnover.reduce((s, a) => s + a.turnoverDays, 0) / validTurnover.length) * 10) / 10
        : 0,
      conversionRate: prevQty > 0 ? Math.round((qtySum / prevQty) * 1000) / 10 : 100,
    };
  });

  return {
    stages,
    filters: {
      ...filters,
      caliberVersion: filters.caliberVersion || "v1.0",
    },
    totalPlanned: stages[0]?.value || 0,
    totalCompleted: stages[stages.length - 1]?.value || 0,
    overallConversion: stages[0]?.value > 0
      ? Math.round((stages[stages.length - 1].value / stages[0].value) * 1000) / 10
      : 0,
    totalShortage: stages.reduce((s, st) => s + st.shortageQty, 0),
  };
}

export function getSites() {
  return MOCK_SITES;
}

export function getMaterials() {
  return MOCK_MATERIALS;
}

export async function getSyncTasks() {
  const prisma = await getPrisma(true);
  const tasks = await prisma.syncTask.findMany({
    orderBy: { createdAt: "asc" },
  });
  if (tasks.length === 0) {
    return MOCK_SYNC_TASKS.map((t) => ({
      id: t.id,
      taskType: t.taskType,
      status: t.status,
      totalCount: t.totalCount,
      successCount: t.successCount,
      failedCount: t.failedCount,
      lastRun: t.lastRun,
    }));
  }
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

  const result = anomalies.map((a: any) => ({
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

  if (result.length === 0 && Object.keys(filters).every((k) => !(filters as any)[k])) {
    return MOCK_ANOMALIES.map((a) => enrichAnomaly(a));
  }
  return result;
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

export function getSafetyStocks(siteId?: string) {
  let list = MOCK_SAFETY_STOCKS;
  if (siteId) list = list.filter((s) => s.siteId === siteId);
  return list.map((s) => ({
    ...s,
    materialName: MOCK_MATERIALS.find((m) => m.id === s.materialId)?.name,
    materialCode: MOCK_MATERIALS.find((m) => m.id === s.materialId)?.code,
    unit: MOCK_MATERIALS.find((m) => m.id === s.materialId)?.unit,
    status: s.currentStock < s.minQty ? "不足" : s.currentStock > s.maxQty ? "过高" : "正常",
  }));
}

export function getInventoryRecords(siteId?: string, materialId?: string, limit = 50) {
  let list = [...MOCK_INVENTORY_RECORDS];
  if (siteId) list = list.filter((r) => r.siteId === siteId);
  if (materialId) list = list.filter((r) => r.materialId === materialId);
  list.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return list.slice(0, limit).map((r) => ({
    ...r,
    materialName: MOCK_MATERIALS.find((m) => m.id === r.materialId)?.name,
    unit: MOCK_MATERIALS.find((m) => m.id === r.materialId)?.unit,
    siteName: MOCK_SITES.find((s) => s.id === r.siteId)?.name,
  }));
}

export function getStockCountDiffs(siteId?: string) {
  let list = MOCK_STOCK_COUNT_DIFFS;
  if (siteId) list = list.filter((d) => d.siteId === siteId);
  return list.map((d) => ({
    ...d,
    materialName: MOCK_MATERIALS.find((m) => m.id === d.materialId)?.name,
    unit: MOCK_MATERIALS.find((m) => m.id === d.materialId)?.unit,
    siteName: MOCK_SITES.find((s) => s.id === d.siteId)?.name,
    hasRawSample: !!d.rawSampleRef,
  }));
}

export function getRawSamples(diffId: string) {
  return MOCK_RAW_SAMPLES.filter((s) => s.diffId === diffId);
}

export function getStockDiffDrilldown(diffId: string) {
  const diff = MOCK_STOCK_COUNT_DIFFS.find((d) => d.id === diffId);
  if (!diff) return null;
  const material = MOCK_MATERIALS.find((m) => m.id === diff.materialId);
  const safety = MOCK_SAFETY_STOCKS.find((s) => s.materialId === diff.materialId && s.siteId === diff.siteId);
  const inventory = getInventoryRecords(diff.siteId, diff.materialId, 20);
  const samples = getRawSamples(diffId);
  const notes = getNotes({ stockDiffId: diffId });
  return {
    diff: {
      ...diff,
      materialName: material?.name,
      materialCode: material?.code,
      unit: material?.unit,
      standardDays: material?.standardDays,
    },
    safetyStock: safety ? {
      ...safety,
      materialName: material?.name,
      materialCode: material?.code,
      unit: material?.unit,
      status: safety.currentStock < safety.minQty ? "不足" : safety.currentStock > safety.maxQty ? "过高" : "正常",
    } : null,
    inventoryRecords: inventory,
    rawSamples: samples,
    notes,
  };
}

export function getNotes(filters: { siteId?: string; stockDiffId?: string } = {}) {
  let list = [...MOCK_NOTES];
  if (filters.siteId) list = list.filter((n) => n.siteId === filters.siteId);
  if (filters.stockDiffId) list = list.filter((n) => n.stockDiffId === filters.stockDiffId);
  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return list;
}

let noteIdCounter = 100;
export function addNote(input: { content: string; author: string; siteId: string; stockDiffId?: string | null }) {
  const note: MockNote = {
    id: `note-new-${noteIdCounter++}`,
    content: input.content,
    author: input.author,
    siteId: input.siteId,
    stockDiffId: input.stockDiffId || null,
    createdAt: new Date(),
  };
  (MOCK_NOTES as unknown as MockNote[]).push(note);
  return note;
}

export interface ExportParams {
  siteId?: string;
  materialCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  caliberVersion: string;
}

export function buildExportData(params: ExportParams) {
  const funnel = getFunnelData(params);
  const arrivals = MOCK_ARRIVALS
    .filter((a) => (params.siteId ? a.siteId === params.siteId : true))
    .map((a) => {
      const site = MOCK_SITES.find((s) => s.id === a.siteId);
      const mat = MOCK_MATERIALS.find((m) => m.id === a.materialId);
      return {
        项目编号: site?.projectNo,
        工地名称: site?.name,
        材料名称: mat?.name,
        材料编码: mat?.code,
        批次号: a.batchNo,
        当前阶段: funnel.stages.find((s) => s.stage === a.stage)?.label,
        状态: a.status,
        计划数量: a.plannedQty,
        实际数量: a.actualQty,
        单位: mat?.unit,
        是否短缺: a.hasShortage ? "是" : "否",
        短缺数量: a.shortageQty,
        计划日期: a.plannedDate.toISOString().slice(0, 10),
        实际日期: a.actualDate?.toISOString().slice(0, 10) || "",
        周转天数: a.turnoverDays ?? "未完成",
        标准周转天数: mat?.standardDays,
        采购单号: a.purchaseRef,
        验收人: a.inspector,
        口径版本: a.caliberVersion,
      };
    });

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
    arrivals,
  };
}

export function getArrivals(filters: FunnelFilters = {}) {
  let arrivals = [...MOCK_ARRIVALS];
  if (filters.siteId) arrivals = arrivals.filter((a) => a.siteId === filters.siteId);
  if (filters.dateFrom) arrivals = arrivals.filter((a) => a.plannedDate >= new Date(filters.dateFrom!));
  if (filters.dateTo) arrivals = arrivals.filter((a) => a.plannedDate <= new Date(filters.dateTo!));
  arrivals.sort((a, b) => b.plannedDate.getTime() - a.plannedDate.getTime());
  return arrivals.map((a) => ({
    ...a,
    siteName: MOCK_SITES.find((s) => s.id === a.siteId)?.name,
    materialName: MOCK_MATERIALS.find((m) => m.id === a.materialId)?.name,
    unit: MOCK_MATERIALS.find((m) => m.id === a.materialId)?.unit,
  }));
}

export function getMaterialCategories() {
  const set = new Set(MOCK_MATERIALS.map((m) => m.category));
  return Array.from(set);
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
