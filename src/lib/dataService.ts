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
import {
  readAnomaliesFromFile,
  writeAnomaliesToFile,
  readSyncTasksFromFile,
  writeSyncTasksToFile,
} from "./fileStorage";

let prismaClient: any = null;
let prismaChecked = false;
let prismaAvailable = false;

async function getPrisma(): Promise<any | null> {
  if (prismaChecked) return prismaAvailable ? prismaClient : null;
  try {
    const { prisma } = await import("./prisma");
    await prisma.$queryRaw`SELECT 1`;
    prismaClient = prisma;
    prismaAvailable = true;
  } catch {
    prismaAvailable = false;
  }
  prismaChecked = true;
  return prismaAvailable ? prismaClient : null;
}

function hasFileStorage(): boolean {
  return typeof window === "undefined";
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

function serializeAnomaly(a: MockAnomaly): any {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
  };
}

function deserializeAnomaly(obj: any): MockAnomaly {
  return {
    ...obj,
    createdAt: new Date(obj.createdAt),
  };
}

function serializeSyncTask(t: MockSyncTask): any {
  return {
    ...t,
    lastRun: t.lastRun.toISOString(),
  };
}

function deserializeSyncTask(obj: any): MockSyncTask {
  return {
    ...obj,
    lastRun: new Date(obj.lastRun),
  };
}

let fileAnomaliesCache: MockAnomaly[] | null = null;
let fileSyncTasksCache: MockSyncTask[] | null = null;
let cacheInitialized = false;

function initFileCache() {
  if (cacheInitialized || !hasFileStorage()) return;
  const storedAnomalies = readAnomaliesFromFile<any[]>([]);
  if (storedAnomalies.length > 0) {
    fileAnomaliesCache = storedAnomalies.map(deserializeAnomaly);
  } else {
    fileAnomaliesCache = [...MOCK_ANOMALIES];
    writeAnomaliesToFile(fileAnomaliesCache.map(serializeAnomaly));
  }
  const storedTasks = readSyncTasksFromFile<any[]>([]);
  if (storedTasks.length > 0) {
    fileSyncTasksCache = storedTasks.map(deserializeSyncTask);
  } else {
    fileSyncTasksCache = [...MOCK_SYNC_TASKS];
    writeSyncTasksToFile(fileSyncTasksCache.map(serializeSyncTask));
  }
  cacheInitialized = true;
}

function getAnomaliesStorage(): MockAnomaly[] {
  if (hasFileStorage()) {
    initFileCache();
    return fileAnomaliesCache!;
  }
  return MOCK_ANOMALIES as unknown as MockAnomaly[];
}

function saveAnomaliesStorage(list: MockAnomaly[]): void {
  if (hasFileStorage()) {
    fileAnomaliesCache = list;
    writeAnomaliesToFile(list.map(serializeAnomaly));
  }
}

function getSyncTasksStorage(): MockSyncTask[] {
  if (hasFileStorage()) {
    initFileCache();
    return fileSyncTasksCache!;
  }
  return MOCK_SYNC_TASKS as unknown as MockSyncTask[];
}

function saveSyncTasksStorage(list: MockSyncTask[]): void {
  if (hasFileStorage()) {
    fileSyncTasksCache = list;
    writeSyncTasksToFile(list.map(serializeSyncTask));
  }
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
  const prisma = await getPrisma();
  if (prisma) {
    try {
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
    } catch {
      // fall through to file storage
    }
  }
  return getSyncTasksStorage();
}

export interface AnomalyFilters {
  siteId?: string;
  anomalyType?: string;
  status?: string;
  severity?: string;
}

export async function getAnomalies(filters: AnomalyFilters = {}) {
  const prisma = await getPrisma();
  if (prisma) {
    try {
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
    } catch {
      // fall through to file storage
    }
  }

  let list = [...getAnomaliesStorage()];
  if (filters.siteId) list = list.filter((a) => a.siteId === filters.siteId);
  if (filters.anomalyType) list = list.filter((a) => a.anomalyType === filters.anomalyType);
  if (filters.status) list = list.filter((a) => a.status === filters.status);
  if (filters.severity) list = list.filter((a) => a.severity === filters.severity);
  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return list.map((a) => enrichAnomaly(a));
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

function getDataSourceByType(taskType: string): {
  source: Array<{ id: string; siteId: string; syncStatus: string; syncError: string | null }>;
  anomalyType: AnomalyType;
  itemLabel: (item: any) => string;
} {
  switch (taskType) {
    case "SUPERVISOR_PHOTO":
      return {
        source: MOCK_SUPERVISOR_PHOTOS as unknown as Array<{ id: string; siteId: string; syncStatus: string; syncError: string | null; fileName: string }>,
        anomalyType: AnomalyType.PHOTO_MISSING,
        itemLabel: (item) => `照片 ${(item as MockSupervisorPhoto).fileName}`,
      };
    case "PAYMENT_RECORD":
      return {
        source: MOCK_PAYMENT_RECORDS as unknown as Array<{ id: string; siteId: string; syncStatus: string; syncError: string | null; voucherNo: string }>,
        anomalyType: AnomalyType.PAYMENT_MISMATCH,
        itemLabel: (item) => `收款凭证 ${(item as MockPaymentRecord).voucherNo}`,
      };
    case "PURCHASE_ORDER":
      return {
        source: MOCK_PURCHASE_ORDERS as unknown as Array<{ id: string; siteId: string; syncStatus: string; syncError: string | null; orderNo: string }>,
        anomalyType: AnomalyType.ORDER_MISSING,
        itemLabel: (item) => `采购单 ${(item as MockPurchaseOrder).orderNo}`,
      };
    default:
      return {
        source: [],
        anomalyType: AnomalyType.OTHER,
        itemLabel: () => "未知项",
      };
  }
}

export async function executeSyncTask(taskType: SyncTaskType | "ALL"): Promise<{
  results: SyncExecuteResult[];
  totalAnomaliesCreated: number;
}> {
  const prisma = await getPrisma();

  if (prisma) {
    return executeSyncTaskWithPrisma(prisma, taskType);
  }

  return executeSyncTaskWithFile(taskType);
}

async function executeSyncTaskWithPrisma(
  prisma: any,
  taskType: SyncTaskType | "ALL"
): Promise<{ results: SyncExecuteResult[]; totalAnomaliesCreated: number }> {
  const taskTypes = taskType === "ALL"
    ? [SyncTaskType.SUPERVISOR_PHOTO, SyncTaskType.PAYMENT_RECORD, SyncTaskType.PURCHASE_ORDER]
    : [taskType];

  const results: SyncExecuteResult[] = [];
  let totalAnomaliesCreated = 0;

  for (const tt of taskTypes) {
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

    const { sourceModel, anomalyType, itemLabelField, photoIdField, paymentIdField, orderIdField } =
      getPrismaDataSourceByType(tt);

    const failedItems = await prisma[sourceModel].findMany({
      where: { syncStatus: SyncStatus.FAILED },
    });

    const totalCount = await prisma[sourceModel].count();
    const successCount = totalCount - failedItems.length;

    const createdAnomalies: MockAnomaly[] = [];

    for (const failedItem of failedItems) {
      const existingAnomaly = await prisma.anomalyItem.findFirst({
        where: {
          anomalyType,
          description: { contains: failedItem.id },
        },
      });

      if (existingAnomaly) {
        if (existingAnomaly.status === AnomalyStatus.RESOLVED) {
          const updated = await prisma.anomalyItem.update({
            where: { id: existingAnomaly.id },
            data: { status: AnomalyStatus.OPEN, createdAt: new Date() },
          });
          createdAnomalies.push(normalizeAnomaly(updated));
        }
        continue;
      }

      const anomalyData: any = {
        anomalyType,
        severity: failedItems.length > 5 ? Severity.HIGH : Severity.MEDIUM,
        siteId: failedItem.siteId,
        title: `${SYNC_TASK_LABELS[tt]}同步失败`,
        description: `${itemLabelField ? failedItem[itemLabelField] : "未知项"} 同步失败，错误原因：${failedItem.syncError || "未知错误"}。关联项ID：${failedItem.id}`,
        status: AnomalyStatus.OPEN,
        caliberUsed: CALIBER_VERSION,
      };

      if (photoIdField) anomalyData.photoId = failedItem.id;
      if (paymentIdField) anomalyData.paymentId = failedItem.id;
      if (orderIdField) anomalyData.orderId = failedItem.id;

      const newAnomaly = await prisma.anomalyItem.create({ data: anomalyData });
      createdAnomalies.push(normalizeAnomaly(newAnomaly));
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
        description: itemLabelField ? fi[itemLabelField] : "未知项",
        error: fi.syncError || "未知错误",
      })),
    });
  }

  return { results, totalAnomaliesCreated };
}

function getPrismaDataSourceByType(taskType: string): {
  sourceModel: string;
  anomalyType: AnomalyType;
  itemLabelField: string | null;
  photoIdField: boolean;
  paymentIdField: boolean;
  orderIdField: boolean;
} {
  switch (taskType) {
    case "SUPERVISOR_PHOTO":
      return {
        sourceModel: "supervisorPhoto",
        anomalyType: AnomalyType.PHOTO_MISSING,
        itemLabelField: "fileName",
        photoIdField: true,
        paymentIdField: false,
        orderIdField: false,
      };
    case "PAYMENT_RECORD":
      return {
        sourceModel: "paymentRecord",
        anomalyType: AnomalyType.PAYMENT_MISMATCH,
        itemLabelField: "voucherNo",
        photoIdField: false,
        paymentIdField: true,
        orderIdField: false,
      };
    case "PURCHASE_ORDER":
      return {
        sourceModel: "purchaseOrder",
        anomalyType: AnomalyType.ORDER_MISSING,
        itemLabelField: "orderNo",
        photoIdField: false,
        paymentIdField: false,
        orderIdField: true,
      };
    default:
      return {
        sourceModel: "",
        anomalyType: AnomalyType.OTHER,
        itemLabelField: null,
        photoIdField: false,
        paymentIdField: false,
        orderIdField: false,
      };
  }
}

async function executeSyncTaskWithFile(
  taskType: SyncTaskType | "ALL"
): Promise<{ results: SyncExecuteResult[]; totalAnomaliesCreated: number }> {
  const taskTypes = taskType === "ALL"
    ? [SyncTaskType.SUPERVISOR_PHOTO, SyncTaskType.PAYMENT_RECORD, SyncTaskType.PURCHASE_ORDER]
    : [taskType];

  const results: SyncExecuteResult[] = [];
  let totalAnomaliesCreated = 0;

  const syncTasks = getSyncTasksStorage();
  const anomalies = getAnomaliesStorage();

  for (const tt of taskTypes) {
    const taskIndex = syncTasks.findIndex((t) => t.taskType === tt);
    if (taskIndex === -1) continue;

    const { source, anomalyType, itemLabel } = getDataSourceByType(tt);
    const failedItems = source.filter((x) => x.syncStatus === SyncStatus.FAILED);

    syncTasks[taskIndex] = { ...syncTasks[taskIndex], status: SyncStatus.SYNCING };
    saveSyncTasksStorage([...syncTasks]);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const createdAnomalies: MockAnomaly[] = [];
    const updatedAnomalies = [...anomalies];

    for (const failedItem of failedItems) {
      const existingIndex = updatedAnomalies.findIndex(
        (a) => a.anomalyType === anomalyType && a.description?.includes(failedItem.id)
      );

      if (existingIndex !== -1) {
        if (updatedAnomalies[existingIndex].status === AnomalyStatus.RESOLVED) {
          updatedAnomalies[existingIndex] = {
            ...updatedAnomalies[existingIndex],
            status: AnomalyStatus.OPEN,
            createdAt: new Date(),
          };
          createdAnomalies.push(updatedAnomalies[existingIndex]);
        }
        continue;
      }

      const newAnomaly: MockAnomaly = {
        id: `anom-sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        anomalyType,
        severity: failedItems.length > 5 ? Severity.HIGH : Severity.MEDIUM,
        siteId: failedItem.siteId,
        arrivalId: null,
        title: `${SYNC_TASK_LABELS[tt]}同步失败`,
        description: `${itemLabel(failedItem)} 同步失败，错误原因：${failedItem.syncError || "未知错误"}。关联项ID：${failedItem.id}`,
        status: AnomalyStatus.OPEN,
        assignee: null,
        createdAt: new Date(),
      };
      updatedAnomalies.push(newAnomaly);
      createdAnomalies.push(newAnomaly);
    }

    saveAnomaliesStorage(updatedAnomalies);

    syncTasks[taskIndex] = {
      ...syncTasks[taskIndex],
      status: SyncStatus.SYNCED,
      successCount: syncTasks[taskIndex].totalCount - failedItems.length,
      failedCount: failedItems.length,
      lastRun: new Date(),
    };
    saveSyncTasksStorage([...syncTasks]);

    totalAnomaliesCreated += createdAnomalies.length;

    results.push({
      task: syncTasks[taskIndex],
      createdAnomalies,
      failedItems: failedItems.map((fi) => ({
        id: fi.id,
        type: tt,
        siteId: fi.siteId,
        description: itemLabel(fi),
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
