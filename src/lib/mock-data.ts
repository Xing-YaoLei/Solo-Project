import {
  MaterialEntry,
  Batch,
  ImportBatch,
  Supplier,
  Requisition,
  InventoryDistribution,
  FunnelStage,
  SupplierRanking,
  RequisitionTrend,
  EntryTrendPoint,
  KpiData,
  AlertItem,
} from "@/types";

let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function resetSeed() { _seed = 42; }

const suppliers: Supplier[] = [
  { id: "s1", name: "东方建材集团", contactPerson: "张明", phone: "138-0001-0001", onTimeRate: 0.95, shortageRate: 0.02, qualityScore: 4.8, totalDeliveries: 156 },
  { id: "s2", name: "鑫达装饰材料", contactPerson: "李伟", phone: "138-0002-0002", onTimeRate: 0.88, shortageRate: 0.08, qualityScore: 4.2, totalDeliveries: 98 },
  { id: "s3", name: "华美五金机电", contactPerson: "王芳", phone: "138-0003-0003", onTimeRate: 0.92, shortageRate: 0.05, qualityScore: 4.5, totalDeliveries: 123 },
  { id: "s4", name: "恒泰管业", contactPerson: "赵刚", phone: "138-0004-0004", onTimeRate: 0.78, shortageRate: 0.15, qualityScore: 3.8, totalDeliveries: 67 },
  { id: "s5", name: "绿源涂料", contactPerson: "陈静", phone: "138-0005-0005", onTimeRate: 0.91, shortageRate: 0.04, qualityScore: 4.6, totalDeliveries: 89 },
];

const categories = ["瓷砖", "涂料", "管材", "五金", "电线", "木材", "玻璃", "防水材料"];

const materialNames: Record<string, string[]> = {
  "瓷砖": ["600x600抛光砖", "800x800全抛釉", "300x600墙砖", "300x300地砖"],
  "涂料": ["内墙乳胶漆", "外墙真石漆", "底漆", "防水涂料"],
  "管材": ["PPR热水管", "PVC排水管", "铝塑复合管", "地暖管"],
  "五金": ["门锁", "合页", "角阀", "龙头"],
  "电线": ["BV2.5铜线", "BV4铜线", "网线", "护套线"],
  "木材": ["细木工板", "密度板", "实木地板", "生态板"],
  "玻璃": ["钢化玻璃", "中空玻璃", "磨砂玻璃", "夹胶玻璃"],
  "防水材料": ["聚氨酯防水", "JS防水涂料", "SBS卷材", "堵漏宝"],
};

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function generateMaterialEntries(): MaterialEntry[] {
  resetSeed();
  const entries: MaterialEntry[] = [];
  const statuses: MaterialEntry["status"][] = ["ARRIVED", "IN_STOCK", "RECLAIMED", "EXPIRED"];

  for (let i = 0; i < 120; i++) {
    const cat = randomItem(categories);
    const names = materialNames[cat];
    const supplier = randomItem(suppliers);
    const status = randomItem(statuses);
    const entryDate = randomDate(new Date("2025-01-01"), new Date("2026-06-15"));
    const hasShortage = seededRandom() < 0.12;

    entries.push({
      id: `me-${i + 1}`,
      batchId: `b-${Math.floor(i / 4) + 1}`,
      materialName: randomItem(names),
      category: cat,
      specification: `${Math.floor(seededRandom() * 50 + 10)}kg/件`,
      quantity: Math.floor(seededRandom() * 200 + 10),
      unit: ["件", "桶", "卷", "米", "箱"][Math.floor(seededRandom() * 5)],
      supplierId: supplier.id,
      supplierName: supplier.name,
      entryDate,
      status,
      shortageNote: hasShortage ? `实际到场缺${Math.floor(seededRandom() * 10 + 1)}件，供应商承诺补货` : null,
      shortageNoteBy: hasShortage ? "u-2" : null,
      shortageNoteAt: hasShortage ? randomDate(new Date(entryDate), new Date("2026-06-18")) : null,
      expiryDate: seededRandom() < 0.3 ? randomDate(new Date("2026-06-01"), new Date("2026-12-31")) : null,
    });
  }
  return entries;
}

function generateBatches(): Batch[] {
  const sources: Batch["importSource"][] = ["PAYMENT", "DESIGN_EXPORT", "PHOTO", "MANUAL"];
  const statuses: Batch["status"][] = ["COMPLETE", "SHORTAGE", "PARTIAL"];
  const batches: Batch[] = [];
  const projects = ["翡翠湾A栋", "云顶花园3期", "湖畔春天B区", "锦绣华庭"];

  for (let i = 0; i < 30; i++) {
    batches.push({
      id: `b-${i + 1}`,
      batchNo: `BATCH-2025-${String(i + 1).padStart(3, "0")}`,
      importSource: randomItem(sources),
      importBatchId: `ib-${Math.floor(i / 3) + 1}`,
      projectId: `p-${(i % 4) + 1}`,
      projectName: projects[i % 4],
      status: randomItem(statuses),
      notes: seededRandom() < 0.2 ? "部分材料延迟到货" : null,
      createdAt: randomDate(new Date("2025-01-01"), new Date("2026-06-15")),
    });
  }
  return batches;
}

function generateImportBatches(): ImportBatch[] {
  const sources: ImportBatch["source"][] = ["PAYMENT", "DESIGN_EXPORT", "PHOTO"];
  const batches: ImportBatch[] = [];

  for (let i = 0; i < 10; i++) {
    batches.push({
      id: `ib-${i + 1}`,
      batchNo: `IMP-2025-${String(i + 1).padStart(3, "0")}`,
      source: randomItem(sources),
      importedAt: randomDate(new Date("2025-01-01"), new Date("2026-06-15")),
      importedBy: `u-${(i % 3) + 1}`,
      recordCount: Math.floor(seededRandom() * 30 + 5),
      fileUrl: seededRandom() < 0.5 ? `/uploads/batch-${i + 1}.xlsx` : null,
    });
  }
  return batches;
}

function generateRequisitions(): Requisition[] {
  const reqs: Requisition[] = [];
  const projects = ["翡翠湾A栋", "云顶花园3期", "湖畔春天B区", "锦绣华庭"];
  const statuses: Requisition["status"][] = ["PENDING", "APPROVED", "FULFILLED"];

  for (let i = 0; i < 60; i++) {
    const c = randomItem(categories);
    reqs.push({
      id: `req-${i + 1}`,
      materialEntryId: `me-${Math.floor(seededRandom() * 120) + 1}`,
      materialName: randomItem(materialNames[c]),
      category: c,
      projectId: `p-${(i % 4) + 1}`,
      projectName: projects[i % 4],
      requestedBy: `u-${(i % 3) + 1}`,
      quantity: Math.floor(seededRandom() * 50 + 1),
      requestedAt: randomDate(new Date("2025-01-01"), new Date("2026-06-15")),
      status: randomItem(statuses),
    });
  }
  return reqs;
}

export const mockSuppliers = suppliers;
export const mockMaterialEntries = generateMaterialEntries();
export const mockBatches = generateBatches();
export const mockImportBatches = generateImportBatches();
export const mockRequisitions = generateRequisitions();

export function getKpiData(): KpiData {
  const entries = mockMaterialEntries;
  const monthStart = "2026-06-01";
  const monthlyEntries = entries.filter((e) => e.entryDate >= monthStart);
  const inStockEntries = entries.filter((e) => e.status === "IN_STOCK");
  const shortageBatches = mockBatches.filter((b) => b.status === "SHORTAGE");

  return {
    monthlyTotal: monthlyEntries.reduce((s, e) => s + e.quantity, 0),
    inStockTotal: inStockEntries.reduce((s, e) => s + e.quantity, 0),
    avgTurnoverDays: 7.2,
    shortageBatchCount: shortageBatches.length,
  };
}

export function getAlerts(): AlertItem[] {
  const alerts: AlertItem[] = [];

  mockBatches.filter((b) => b.status === "SHORTAGE").forEach((b) => {
    alerts.push({
      id: `alert-s-${b.id}`,
      type: "SHORTAGE",
      message: `批次 ${b.batchNo} 存在材料短缺`,
      batchNo: b.batchNo,
      timestamp: b.createdAt,
    });
  });

  mockMaterialEntries.filter((e) => e.expiryDate && new Date(e.expiryDate) < new Date("2026-08-01")).forEach((e) => {
    alerts.push({
      id: `alert-e-${e.id}`,
      type: "EXPIRY_WARNING",
      message: `${e.materialName} 即将过期 (${e.expiryDate})`,
      batchNo: mockBatches.find((b) => b.id === e.batchId)?.batchNo || "",
      timestamp: e.entryDate,
    });
  });

  mockMaterialEntries.filter((e) => e.status === "ARRIVED" && new Date(e.entryDate) < new Date("2026-04-01")).forEach((e) => {
    alerts.push({
      id: `alert-o-${e.id}`,
      type: "OVERDUE",
      message: `${e.materialName} 超期未领用`,
      batchNo: mockBatches.find((b) => b.id === e.batchId)?.batchNo || "",
      timestamp: e.entryDate,
    });
  });

  return alerts.slice(0, 15);
}

export function getEntryTrend(days: number = 30): EntryTrendPoint[] {
  const result: EntryTrendPoint[] = [];
  const now = new Date("2026-06-18");
  const trendSeed = [3, 5, 2, 4, 6, 3, 7, 4, 5, 2, 8, 3, 4, 6, 5, 3, 2, 7, 4, 5, 6, 3, 4, 8, 2, 5, 3, 6, 4, 7,
    45, 120, 80, 150, 200, 90, 160, 110, 75, 180, 95, 130, 55, 170, 100, 140, 85, 60, 190, 105,
    3, 5, 2, 4, 6, 3, 7, 4, 5, 2, 8, 3, 4, 6, 5, 3, 2, 7, 4, 5, 6, 3, 4, 8, 2, 5, 3, 6, 4, 7,
    45, 120, 80, 150, 200, 90, 160, 110, 75, 180, 95, 130, 55, 170, 100, 140, 85, 60, 190, 105,
    3, 5, 2, 4, 6, 3, 7, 4, 5, 2, 8, 3, 4, 6, 5, 3, 2, 7, 4, 5, 6, 3, 4, 8, 2, 5, 3, 6, 4, 7];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const idx = (days - 1 - i);
    result.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      count: trendSeed[idx % trendSeed.length] % 10,
      quantity: trendSeed[(idx + 30) % trendSeed.length],
    });
  }
  return result;
}

export function getInventoryDistribution(): InventoryDistribution[] {
  const total = mockMaterialEntries.filter((e) => e.status === "IN_STOCK").reduce((s, e) => s + e.quantity, 0);
  const byCategory: Record<string, number> = {};

  mockMaterialEntries.filter((e) => e.status === "IN_STOCK").forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.quantity;
  });

  return Object.entries(byCategory).map(([category, quantity]) => ({
    category,
    quantity,
    percentage: Math.round((quantity / total) * 1000) / 10,
  }));
}

export function getFunnelStages(): FunnelStage[] {
  const total = mockMaterialEntries.length;
  const arrived = mockMaterialEntries.filter((e) => e.status === "ARRIVED" || e.status === "IN_STOCK" || e.status === "RECLAIMED").length;
  const inStock = mockMaterialEntries.filter((e) => e.status === "IN_STOCK" || e.status === "RECLAIMED").length;
  const reclaimed = mockMaterialEntries.filter((e) => e.status === "RECLAIMED").length;
  const expiring = mockMaterialEntries.filter((e) => e.expiryDate && new Date(e.expiryDate) < new Date("2026-09-01")).length;

  return [
    { stage: "进场登记", count: total, conversionRate: 1 },
    { stage: "在库管理", count: arrived, conversionRate: Math.round((arrived / total) * 100) },
    { stage: "已领用", count: inStock, conversionRate: Math.round((inStock / total) * 100) },
    { stage: "效期预警", count: reclaimed, conversionRate: Math.round((reclaimed / total) * 100) },
    { stage: "过期处理", count: expiring, conversionRate: Math.round((expiring / total) * 100) },
  ];
}

export function getSupplierRankings(): SupplierRanking[] {
  return suppliers.map((s) => ({
    supplierId: s.id,
    supplierName: s.name,
    onTimeRate: s.onTimeRate,
    shortageRate: s.shortageRate,
    qualityScore: s.qualityScore,
    totalDeliveries: s.totalDeliveries,
  })).sort((a, b) => b.onTimeRate - a.onTimeRate);
}

export function getRequisitionTrends(): RequisitionTrend[] {
  const result: RequisitionTrend[] = [];
  const now = new Date("2026-06-18");
  const selectedCats = ["瓷砖", "涂料", "管材", "五金"];
  const catBaseQty: Record<string, number> = { "瓷砖": 25, "涂料": 18, "管材": 12, "五金": 8 };
  const variation = [0.6, 0.8, 1.0, 1.2, 1.4, 0.9, 1.1, 0.7, 1.3, 0.85];

  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    selectedCats.forEach((cat) => {
      result.push({
        date: dateStr,
        category: cat,
        quantity: Math.round(catBaseQty[cat] * variation[(i + selectedCats.indexOf(cat)) % variation.length]),
      });
    });
  }
  return result;
}
