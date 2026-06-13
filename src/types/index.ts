export type UserRole = 'MANAGER' | 'TECHNICIAN';

export type BatchType = 'INVENTORY' | 'TRANSACTION' | 'REVIEW';

export type BatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type TransactionStatus = 'PAID' | 'REFUNDED';

export type OrderStatus = 'CREATED' | 'IN_SERVICE' | 'COMPLETED' | 'PAID' | 'REVIEWED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface ImportBatch {
  id: string;
  batchNo: string;
  type: BatchType;
  fileName: string;
  recordCount: number;
  importedBy: string;
  importedAt: Date;
  status: BatchStatus;
  errorMessage?: string;
  importer?: User;
}

export interface Inventory {
  id: string;
  batchId: string;
  skuCode: string;
  productName: string;
  category: string;
  unit: string;
  stockQuantity: number;
  unitPrice: number;
  importedAt: Date;
}

export interface Transaction {
  id: string;
  batchId: string;
  orderNo: string;
  handNo: string;
  technicianId: string;
  serviceItem: string;
  amount: number;
  paymentMethod: string;
  transactionTime: Date;
  status: TransactionStatus;
  technician?: User;
}

export interface Review {
  id: string;
  batchId: string;
  orderNo: string;
  rating: number;
  content?: string;
  hasBeforePhoto: boolean;
  hasAfterPhoto: boolean;
  followUpScript?: string;
  responded: boolean;
  reviewedAt: Date;
}

export interface InventoryUsage {
  id: string;
  orderId: string;
  inventoryId: string;
  quantity: number;
  isAbnormal: boolean;
  abnormalNote?: string;
  notedBy?: string;
  notedAt?: Date;
  inventory?: Inventory;
}

export interface HandOrder {
  id: string;
  handNo: string;
  technicianId: string;
  customerName?: string;
  serviceItems: string[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  completedAt?: Date;
  technician?: User;
  transactions?: Transaction[];
  inventoryItems?: InventoryUsage[];
  review?: Review;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  completionRate: number;
  yoyGrowth: number;
}

export interface FunnelData {
  stage: string;
  value: number;
  conversionRate: number;
}

export interface TechnicianRank {
  id: string;
  name: string;
  avatarUrl?: string;
  totalRevenue: number;
  orderCount: number;
  avgRating: number;
}

export interface ConsumptionData {
  name: string;
  value: number;
  count?: number;
}

export interface PhotoFunnelData {
  stage: string;
  value: number;
  conversionRate: number;
}

export interface InventoryRank {
  id: string;
  productName: string;
  category: string;
  totalUsed: number;
  abnormalCount: number;
  abnormalRate: number;
}

export interface FollowupTrend {
  date: string;
  script: string;
  responseRate: number;
  count: number;
}

export interface TechnicianMetrics {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  avgRating: number;
  completionRate: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}
