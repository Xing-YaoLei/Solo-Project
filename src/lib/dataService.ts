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

export function getSyncTasks() {
  return MOCK_SYNC_TASKS;
}

export interface AnomalyFilters {
  siteId?: string;
  anomalyType?: string;
  status?: string;
  severity?: string;
}

export function getAnomalies(filters: AnomalyFilters = {}) {
  let list = [...MOCK_ANOMALIES];
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
  const taskTypes = taskType === "ALL"
    ? [SyncTaskType.SUPERVISOR_PHOTO, SyncTaskType.PAYMENT_RECORD, SyncTaskType.PURCHASE_ORDER]
    : [taskType];

  const results: SyncExecuteResult[] = [];
  let totalAnomaliesCreated = 0;

  for (const tt of taskTypes) {
    const task = MOCK_SYNC_TASKS.find((t) => t.taskType === tt);
    if (!task) continue;

    const { source, anomalyType, itemLabel } = getDataSourceByType(tt);
    const failedItems = source.filter((x) => x.syncStatus === SyncStatus.FAILED);

    (MOCK_SYNC_TASKS as unknown as MockSyncTask[]).forEach((t) => {
      if (t.taskType === tt) {
        t.status = SyncStatus.SYNCING;
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const createdAnomalies: MockAnomaly[] = [];

    for (const failedItem of failedItems) {
      const existingAnomaly = MOCK_ANOMALIES.find(
        (a) => a.anomalyType === anomalyType && a.description?.includes(failedItem.id)
      );
      if (existingAnomaly) {
        if (existingAnomaly.status === AnomalyStatus.RESOLVED) {
          existingAnomaly.status = AnomalyStatus.OPEN;
          existingAnomaly.createdAt = new Date();
          createdAnomalies.push(existingAnomaly);
        }
        continue;
      }

      const site = MOCK_SITES.find((s) => s.id === failedItem.siteId);
      const newAnomaly: MockAnomaly = {
        id: `anom-sync-${anomalyIdCounter++}`,
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
      (MOCK_ANOMALIES as unknown as MockAnomaly[]).push(newAnomaly);
      createdAnomalies.push(newAnomaly);
    }

    (MOCK_SYNC_TASKS as unknown as MockSyncTask[]).forEach((t) => {
      if (t.taskType === tt) {
        t.status = SyncStatus.SYNCED;
        t.successCount = t.totalCount - failedItems.length;
        t.failedCount = failedItems.length;
        t.lastRun = new Date();
      }
    });

    totalAnomaliesCreated += createdAnomalies.length;

    const updatedTask = MOCK_SYNC_TASKS.find((t) => t.taskType === tt)!;
    results.push({
      task: updatedTask,
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
