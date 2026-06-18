export interface MaterialEntry {
  id: string;
  batchId: string;
  materialName: string;
  category: string;
  specification: string;
  quantity: number;
  unit: string;
  supplierId: string;
  supplierName: string;
  entryDate: string;
  status: "ARRIVED" | "IN_STOCK" | "RECLAIMED" | "EXPIRED";
  shortageNote: string | null;
  shortageNoteBy: string | null;
  shortageNoteAt: string | null;
  expiryDate: string | null;
}

export interface Batch {
  id: string;
  batchNo: string;
  importSource: "PAYMENT" | "DESIGN_EXPORT" | "PHOTO" | "MANUAL";
  importBatchId: string;
  projectId: string;
  projectName: string;
  status: "COMPLETE" | "SHORTAGE" | "PARTIAL";
  notes: string | null;
  createdAt: string;
}

export interface ImportBatch {
  id: string;
  batchNo: string;
  source: "PAYMENT" | "DESIGN_EXPORT" | "PHOTO";
  importedAt: string;
  importedBy: string;
  recordCount: number;
  fileUrl: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  onTimeRate: number;
  shortageRate: number;
  qualityScore: number;
  totalDeliveries: number;
}

export interface Requisition {
  id: string;
  materialEntryId: string;
  materialName: string;
  category: string;
  projectId: string;
  projectName: string;
  requestedBy: string;
  quantity: number;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "FULFILLED";
}

export interface InventoryDistribution {
  category: string;
  quantity: number;
  percentage: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface SupplierRanking {
  supplierId: string;
  supplierName: string;
  onTimeRate: number;
  shortageRate: number;
  qualityScore: number;
  totalDeliveries: number;
}

export interface RequisitionTrend {
  date: string;
  category: string;
  quantity: number;
}

export interface EntryTrendPoint {
  date: string;
  count: number;
  quantity: number;
}

export interface KpiData {
  monthlyTotal: number;
  inStockTotal: number;
  avgTurnoverDays: number;
  shortageBatchCount: number;
}

export interface AlertItem {
  id: string;
  type: "SHORTAGE" | "EXPIRY_WARNING" | "OVERDUE";
  message: string;
  batchNo: string;
  timestamp: string;
}
