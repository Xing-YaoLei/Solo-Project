export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'worker' | 'manager';
  region: string;
  createdAt: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type BatchStatus = 'in_stock' | 'in_use' | 'shortage' | 'closed';
export type ShortageStatus = 'pending' | 'processing' | 'supplemented' | 'retried' | 'closed';
export type ShortagePriority = 'high' | 'medium' | 'low';
export type SupplierLevel = 'A' | 'B' | 'C';
export type RecordType = 'in' | 'out' | 'transfer' | 'adjust';
export type ShortageAction = 'create' | 'assign' | 'supplement' | 'retry' | 'close';

export interface MaterialBatch {
  id: string;
  batchNo: string;
  materialName: string;
  specification: string;
  category: string;
  quantity: number;
  unit: string;
  supplierId: string;
  supplierName: string;
  region: string;
  responsiblePersonId: string;
  responsiblePerson: string;
  status: BatchStatus;
  inDate: string;
  expectedTurnoverDays: number;
  actualTurnoverDays?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRecord {
  id: string;
  batchId: string;
  type: RecordType;
  quantity: number;
  operatorId: string;
  operator: string;
  region: string;
  remark: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  categories: string[];
  level: SupplierLevel;
  onTimeRate: number;
  qualityScore: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UsageRule {
  id: string;
  category: string;
  maxQuantityPerDay: number;
  requiresApproval: boolean;
  approvalLevel: number;
  description: string;
  createdAt: string;
}

export interface InventoryThreshold {
  id: string;
  category: string;
  allowableErrorRate: number;
  excessWarningThreshold: number;
  createdAt: string;
}

export interface ShortageOrder {
  id: string;
  batchId: string;
  batchNo: string;
  materialName: string;
  shortageQuantity: number;
  priority: ShortagePriority;
  responsiblePersonId: string;
  responsiblePerson: string;
  status: ShortageStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShortageActionLog {
  id: string;
  shortageId: string;
  action: ShortageAction;
  operatorId: string;
  operator: string;
  remark: string;
  supplementQuantity?: number;
  createdAt: string;
}

export interface SafetyStockConfig {
  id: string;
  materialName: string;
  category: string;
  region: string;
  minStock: number;
  warningStock: number;
  currentStock: number;
  consumptionRate: number;
  estimatedDaysLeft: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface TurnoverAnalysis {
  dimension: 'material' | 'region' | 'person';
  name: string;
  avgTurnoverDays: number;
  totalBatches: number;
  shortageCount: number;
  comparisonLastPeriod: number;
}

export interface InventoryQueryParams {
  status?: BatchStatus[];
  dateRange?: [string, string];
  region?: string[];
  responsiblePerson?: string[];
  category?: string[];
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalBatches: number;
  inStockQuantity: number;
  pendingShortages: number;
  avgTurnoverDays: number;
  turnoverTrend: { date: string; value: number }[];
  shortageTrend: { date: string; value: number }[];
  regionDistribution: { name: string; value: number }[];
  recentAlerts: {
    id: string;
    type: 'shortage' | 'low_stock' | 'overstock';
    message: string;
    priority: ShortagePriority;
    createdAt: string;
  }[];
}

export interface TimelineEvent {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjust' | 'shortage' | 'supplement' | 'close';
  title: string;
  description: string;
  operator: string;
  timestamp: string;
  quantity?: number;
}

export interface TrendData {
  date: string;
  turnoverDays: number;
  shortageCount: number;
  stockValue: number;
}
