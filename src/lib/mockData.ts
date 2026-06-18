import {
  FunnelStage,
  ArrivalStatus,
  SyncStatus,
  AnomalyType,
  Severity,
  AnomalyStatus,
  InventoryType,
  CountStatus,
  PhotoType,
  PaymentType,
  PurchaseStatus,
} from "./constants";
import { CALIBER_VERSION } from "./constants";

const today = new Date("2026-06-18");
const daysAgo = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - d);
  return dt;
};
const randomBetween = (a: number, b: number) => Math.random() * (b - a) + a;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export interface MockSite {
  id: string;
  name: string;
  address: string;
  projectNo: string;
  owner: string;
}

export interface MockMaterial {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  spec: string;
  standardDays: number;
  safetyStock: number;
}

export interface MockMaterialArrival {
  id: string;
  siteId: string;
  materialId: string;
  batchNo: string;
  stage: FunnelStage;
  plannedQty: number;
  actualQty: number;
  shortageQty: number;
  hasShortage: boolean;
  plannedDate: Date;
  actualDate: Date | null;
  turnoverDays: number | null;
  inspector: string;
  status: ArrivalStatus;
  caliberVersion: string;
  purchaseRef: string;
}

export interface MockAnomaly {
  id: string;
  anomalyType: AnomalyType;
  severity: Severity;
  siteId: string;
  arrivalId: string | null;
  title: string;
  description: string;
  status: AnomalyStatus;
  assignee: string | null;
  createdAt: Date;
}

export interface MockSyncTask {
  id: string;
  taskType: "SUPERVISOR_PHOTO" | "PAYMENT_RECORD" | "PURCHASE_ORDER";
  status: SyncStatus;
  totalCount: number;
  successCount: number;
  failedCount: number;
  lastRun: Date;
}

export interface MockSafetyStock {
  id: string;
  materialId: string;
  siteId: string;
  minQty: number;
  maxQty: number;
  reorderQty: number;
  currentStock: number;
}

export interface MockInventoryRecord {
  id: string;
  siteId: string;
  materialId: string;
  recordType: InventoryType;
  qty: number;
  unitPrice: number;
  occurredAt: Date;
  operator: string;
  remark: string;
}

export interface MockStockCountDiff {
  id: string;
  countId: string;
  siteId: string;
  materialId: string;
  systemQty: number;
  actualQty: number;
  diffQty: number;
  diffAmount: number;
  unitPrice: number;
  diffReason: string;
  rawSampleRef: string;
}

export interface MockRawSample {
  id: string;
  diffId: string;
  sampleNo: string;
  sampleData: Record<string, unknown>;
  photoUrl: string;
  takenBy: string;
  takenAt: Date;
}

export interface MockNote {
  id: string;
  content: string;
  author: string;
  siteId: string;
  stockDiffId: string | null;
  createdAt: Date;
}

export const MOCK_SITES: MockSite[] = [
  { id: "site-1", name: "西湖花园3栋1802", address: "杭州市西湖区文一西路123号", projectNo: "XH-2026-0180", owner: "张先生" },
  { id: "site-2", name: "钱江新城5栋2201", address: "杭州市上城区钱江路456号", projectNo: "QJ-2026-0221", owner: "李女士" },
  { id: "site-3", name: "滨江翡翠城8栋903", address: "杭州市滨江区江南大道789号", projectNo: "BJ-2026-0093", owner: "王先生" },
  { id: "site-4", name: "未来科技城2栋1506", address: "杭州市余杭区文一西路999号", projectNo: "WL-2026-0156", owner: "陈先生" },
  { id: "site-5", name: "良渚文化村6栋302", address: "杭州市余杭区良渚路100号", projectNo: "LZ-2026-0032", owner: "赵女士" },
];

export const MOCK_MATERIALS: MockMaterial[] = [
  { id: "mat-1", name: "32.5级复合硅酸盐水泥", code: "CM-001", category: "基础建材", unit: "袋", spec: "50kg/袋", standardDays: 5, safetyStock: 40 },
  { id: "mat-2", name: "河沙（中粗）", code: "SD-002", category: "基础建材", unit: "吨", spec: "2mm-5mm", standardDays: 3, safetyStock: 20 },
  { id: "mat-3", name: "5mm-10mm碎石", code: "GR-003", category: "基础建材", unit: "吨", spec: "5-10mm", standardDays: 3, safetyStock: 25 },
  { id: "mat-4", name: "800×800通体大理石瓷砖", code: "TL-004", category: "瓷砖石材", unit: "片", spec: "800×800mm", standardDays: 7, safetyStock: 30 },
  { id: "mat-5", name: "E0级多层实木板18mm", code: "WD-005", category: "木制品", unit: "张", spec: "1220×2440×18mm", standardDays: 10, safetyStock: 15 },
  { id: "mat-6", name: "PPR热水管DN25", code: "PP-006", category: "水电材料", unit: "米", spec: "DN25×4.2mm", standardDays: 4, safetyStock: 100 },
  { id: "mat-7", name: "BV-4mm²国标铜线", code: "WR-007", category: "水电材料", unit: "卷", spec: "4mm² 100米", standardDays: 4, safetyStock: 8 },
  { id: "mat-8", name: "环保乳胶漆（白色）", code: "PT-008", category: "涂料", unit: "桶", spec: "18L/桶", standardDays: 6, safetyStock: 10 },
];

const stages = Object.values(FunnelStage);
export const MOCK_ARRIVALS: MockMaterialArrival[] = [];
let batchCounter = 1;

MOCK_SITES.forEach((site) => {
  MOCK_MATERIALS.forEach((mat) => {
    const plannedQty = Math.round(randomBetween(20, 200));
    const stageIndex = Math.floor(randomBetween(1, stages.length));
    const stage = stages[stageIndex - 1];
    const actualRatio = stage === stages[stages.length - 1]
      ? randomBetween(0.8, 1.0)
      : randomBetween(0.85, 1.05);
    const actualQty = Math.max(0, Math.round(plannedQty * actualRatio));
    const hasShortage = actualQty < plannedQty * 0.95;
    const shortageQty = hasShortage ? plannedQty - actualQty : 0;
    const plannedDate = daysAgo(Math.round(randomBetween(15, 60)));
    const actualDate = stageIndex >= 4 ? new Date(plannedDate.getTime() + Math.round(randomBetween(1, 10) * 86400000)) : null;
    const turnoverDays = actualDate
      ? Math.round((actualDate.getTime() - plannedDate.getTime()) / 86400000)
      : Math.round((today.getTime() - plannedDate.getTime()) / 86400000);

    MOCK_ARRIVALS.push({
      id: `arr-${batchCounter}`,
      siteId: site.id,
      materialId: mat.id,
      batchNo: `B2026${String(1000 + batchCounter).padStart(4, "0")}`,
      stage,
      plannedQty,
      actualQty,
      shortageQty,
      hasShortage,
      plannedDate,
      actualDate,
      turnoverDays: turnoverDays > mat.standardDays * 2 ? null : turnoverDays,
      inspector: pick(["李监理", "王监理", "张监理", "陈监理"]),
      status: hasShortage ? ArrivalStatus.SHORTAGE : stageIndex === stages.length - 1
        ? ArrivalStatus.COMPLETED
        : pick([ArrivalStatus.IN_PROGRESS, ArrivalStatus.PENDING, ArrivalStatus.IN_PROGRESS]),
      caliberVersion: CALIBER_VERSION,
      purchaseRef: `PO-${String(10000 + batchCounter).padStart(5, "0")}`,
    });
    batchCounter++;
  });
});

export const MOCK_ANOMALIES: MockAnomaly[] = [
  ...MOCK_ARRIVALS.filter(a => a.hasShortage).map((a, i) => ({
    id: `anom-${i + 1}`,
    anomalyType: AnomalyType.BATCH_SHORTAGE,
    severity: a.shortageQty / a.plannedQty > 0.2 ? Severity.HIGH : Severity.MEDIUM,
    siteId: a.siteId,
    arrivalId: a.id,
    title: `批次短缺 ${MOCK_MATERIALS.find(m => m.id === a.materialId)?.name}`,
    description: `计划 ${a.plannedQty}${MOCK_MATERIALS.find(m => m.id === a.materialId)?.unit}，实际 ${a.actualQty}，短缺 ${a.shortageQty}，短缺率 ${((a.shortageQty / a.plannedQty) * 100).toFixed(1)}%`,
    status: i % 3 === 0 ? AnomalyStatus.RESOLVED : i % 3 === 1 ? AnomalyStatus.IN_PROGRESS : AnomalyStatus.OPEN,
    assignee: pick(["王经理", "李工", "张工", null]),
    createdAt: daysAgo(Math.round(randomBetween(1, 14))),
  })),
  {
    id: "anom-photo-1",
    anomalyType: AnomalyType.PHOTO_MISSING,
    severity: Severity.MEDIUM,
    siteId: "site-1",
    arrivalId: null,
    title: "验收照片缺失",
    description: "2026-06-10 水泥批次B20261001验收缺少现场照片",
    status: AnomalyStatus.OPEN,
    assignee: "李监理",
    createdAt: daysAgo(5),
  },
  {
    id: "anom-pay-1",
    anomalyType: AnomalyType.PAYMENT_MISMATCH,
    severity: Severity.HIGH,
    siteId: "site-2",
    arrivalId: null,
    title: "收款金额不符",
    description: "采购单PO-10008金额￥52,800，实际收款￥48,000，差额￥4,800",
    status: AnomalyStatus.IN_PROGRESS,
    assignee: "财务部-小王",
    createdAt: daysAgo(3),
  },
  {
    id: "anom-order-1",
    anomalyType: AnomalyType.ORDER_MISSING,
    severity: Severity.CRITICAL,
    siteId: "site-4",
    arrivalId: null,
    title: "缺少对应采购单",
    description: "批次B20261028材料进场但找不到对应采购订单",
    status: AnomalyStatus.OPEN,
    assignee: null,
    createdAt: daysAgo(1),
  },
];

export const MOCK_SYNC_TASKS: MockSyncTask[] = [
  { id: "sync-1", taskType: "SUPERVISOR_PHOTO", status: SyncStatus.SYNCED, totalCount: 156, successCount: 148, failedCount: 8, lastRun: daysAgo(0) },
  { id: "sync-2", taskType: "PAYMENT_RECORD", status: SyncStatus.SYNCED, totalCount: 42, successCount: 42, failedCount: 0, lastRun: daysAgo(0) },
  { id: "sync-3", taskType: "PURCHASE_ORDER", status: SyncStatus.FAILED, totalCount: 88, successCount: 72, failedCount: 16, lastRun: daysAgo(1) },
];

export const MOCK_SAFETY_STOCKS: MockSafetyStock[] = MOCK_MATERIALS.flatMap((m) =>
  MOCK_SITES.slice(0, 3).map((s, i) => ({
    id: `ss-${m.id}-${s.id}`,
    materialId: m.id,
    siteId: s.id,
    minQty: m.safetyStock,
    maxQty: Math.round(m.safetyStock * 2.5),
    reorderQty: Math.round(m.safetyStock * 1.5),
    currentStock: Math.round(m.safetyStock * randomBetween(0.4, 2.2)),
  }))
);

export const MOCK_INVENTORY_RECORDS: MockInventoryRecord[] = (() => {
  const arr: MockInventoryRecord[] = [];
  let n = 1;
  MOCK_SITES.slice(0, 3).forEach((s) => {
    MOCK_MATERIALS.slice(0, 5).forEach((m) => {
      for (let i = 0; i < 3; i++) {
        arr.push({
          id: `inv-${n++}`,
          siteId: s.id,
          materialId: m.id,
          recordType: pick([InventoryType.INBOUND, InventoryType.OUTBOUND, InventoryType.INBOUND, InventoryType.OUTBOUND, InventoryType.ADJUSTMENT]),
          qty: Math.round(randomBetween(5, 50)),
          unitPrice: Math.round(randomBetween(20, 500)),
          occurredAt: daysAgo(Math.round(randomBetween(1, 30))),
          operator: pick(["仓管员-老刘", "仓管员-小陈", "材料员-小张"]),
          remark: pick(["正常入库", "施工领用", "盘点调整", "部分退货", "正常出库"]),
        });
      }
    });
  });
  return arr;
})();

export const MOCK_STOCK_COUNT_DIFFS: MockStockCountDiff[] = MOCK_SITES.slice(0, 3).flatMap((s, si) =>
  MOCK_MATERIALS.slice(0, 4).map((m, mi) => {
    const systemQty = Math.round(randomBetween(30, 150));
    const actualQty = Math.round(systemQty * randomBetween(0.85, 1.1));
    const unitPrice = Math.round(randomBetween(20, 400));
    const diffQty = actualQty - systemQty;
    return {
      id: `diff-${si}-${mi}`,
      countId: `sc-${si}`,
      siteId: s.id,
      materialId: m.id,
      systemQty,
      actualQty,
      diffQty,
      diffAmount: Math.abs(diffQty) * unitPrice,
      unitPrice,
      diffReason: diffQty < 0 ? pick(["运输破损", "错发漏发", "自然损耗", "账实不符"]) : pick(["入库延迟", "录入错误"]),
      rawSampleRef: diffQty !== 0 ? `sample-${si}-${mi}` : "",
    };
  }).filter(d => d.diffQty !== 0)
);

export const MOCK_RAW_SAMPLES: MockRawSample[] = MOCK_STOCK_COUNT_DIFFS.filter(d => d.rawSampleRef).map((d, i) => ({
  id: `rs-${i}`,
  diffId: d.id,
  sampleNo: `SP${String(2026000 + i).padStart(7, "0")}`,
  sampleData: {
    location: pick(["A区货架", "B区地面", "C区暂存", "临时堆放点"]),
    condition: pick(["包装完好", "包装破损", "部分受潮"]),
    quantity: d.actualQty,
    photosCount: Math.round(randomBetween(1, 6)),
  },
  photoUrl: `https://picsum.photos/seed/sample${i}/400/300`,
  takenBy: pick(["盘点员-王", "盘点员-李", "盘点员-张"]),
  takenAt: daysAgo(Math.round(randomBetween(1, 7))),
}));

export const MOCK_NOTES: MockNote[] = [
  { id: "note-1", content: "已联系供应商，承诺3天内补发短缺20袋水泥", author: "王经理", siteId: "site-1", stockDiffId: null, createdAt: daysAgo(2) },
  { id: "note-2", content: "现场找到漏登瓷砖5片，属于上月盘点差异调整", author: "李工", siteId: "site-2", stockDiffId: MOCK_STOCK_COUNT_DIFFS[0]?.id || null, createdAt: daysAgo(1) },
  { id: "note-3", content: "监理照片已补拍，等待审核上传", author: "张监理", siteId: "site-1", stockDiffId: null, createdAt: daysAgo(0) },
];

export interface MockSupervisorPhoto {
  id: string;
  siteId: string;
  photoUrl: string;
  fileName: string;
  photoType: PhotoType;
  takenAt: Date;
  uploader: string;
  remark: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
}

export interface MockPaymentRecord {
  id: string;
  siteId: string;
  purchaseOrderId: string | null;
  amount: number;
  paymentType: PaymentType;
  payer: string | null;
  payee: string | null;
  paidAt: Date | null;
  voucherNo: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
}

export interface MockPurchaseOrder {
  id: string;
  siteId: string;
  orderNo: string;
  supplier: string | null;
  totalAmount: number;
  status: PurchaseStatus;
  syncStatus: SyncStatus;
  syncError: string | null;
}

export const MOCK_SUPERVISOR_PHOTOS: MockSupervisorPhoto[] = (() => {
  const arr: MockSupervisorPhoto[] = [];
  const photoTypes = Object.values(PhotoType);
  let n = 1;
  MOCK_SITES.forEach((s, si) => {
    for (let i = 0; i < 30 + si * 5; i++) {
      const isFailed = si === 0 && i % 4 === 0;
      arr.push({
        id: `photo-${n++}`,
        siteId: s.id,
        photoUrl: `https://picsum.photos/seed/photo${n}/800/600`,
        fileName: `IMG_${String(20260000 + n)}.jpg`,
        photoType: pick(photoTypes as unknown as PhotoType[]),
        takenAt: daysAgo(Math.round(randomBetween(1, 20))),
        uploader: pick(["李监理", "王监理", "张监理"]),
        remark: i % 7 === 0 ? "材料验收" : null,
        syncStatus: isFailed ? SyncStatus.FAILED : SyncStatus.SYNCED,
        syncError: isFailed ? pick(["上传超时", "文件损坏", "元数据缺失", "存储空间不足"]) : null,
      });
    }
  });
  return arr;
})();

export const MOCK_PAYMENT_RECORDS: MockPaymentRecord[] = (() => {
  const arr: MockPaymentRecord[] = [];
  const paymentTypes = Object.values(PaymentType);
  let n = 1;
  MOCK_SITES.forEach((s, si) => {
    for (let i = 0; i < 8 + si; i++) {
      const isFailed = si === 1 && i % 3 === 2;
      arr.push({
        id: `pay-${n++}`,
        siteId: s.id,
        purchaseOrderId: i % 2 === 0 ? `PO-${String(10000 + n).padStart(5, "0")}` : null,
        amount: Math.round(randomBetween(5000, 100000)),
        paymentType: pick(paymentTypes as unknown as PaymentType[]),
        payer: s.owner,
        payee: pick(["建材供应商A", "建材供应商B", "装修公司", "劳务队"]),
        paidAt: daysAgo(Math.round(randomBetween(1, 15))),
        voucherNo: `V${String(20260000 + n)}`,
        syncStatus: isFailed ? SyncStatus.FAILED : SyncStatus.SYNCED,
        syncError: isFailed ? pick(["金额不匹配", "凭证号重复", "缺少审批记录", "银行回执未上传"]) : null,
      });
    }
  });
  return arr;
})();

export const MOCK_PURCHASE_ORDERS: MockPurchaseOrder[] = (() => {
  const arr: MockPurchaseOrder[] = [];
  const statuses = Object.values(PurchaseStatus);
  let n = 1;
  MOCK_SITES.forEach((s, si) => {
    for (let i = 0; i < 15 + si * 3; i++) {
      const isFailed = si === 2 && i % 5 === 3;
      arr.push({
        id: `po-${n++}`,
        siteId: s.id,
        orderNo: `PO-${String(10000 + n).padStart(5, "0")}`,
        supplier: pick(["建材供应商A", "建材供应商B", "瓷砖专营店", "水电材料批发"]),
        totalAmount: Math.round(randomBetween(10000, 200000)),
        status: pick(statuses as unknown as PurchaseStatus[]),
        syncStatus: isFailed ? SyncStatus.FAILED : SyncStatus.SYNCED,
        syncError: isFailed ? pick(["物料编码不匹配", "采购单价超预算", "供应商信息缺失", "审批流程未完成"]) : null,
      });
    }
  });
  return arr;
})();
