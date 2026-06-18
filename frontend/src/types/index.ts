export interface User {
  id: string;
  email: string;
  fullName: string;
  department?: string;
  position?: string;
  roles: string[];
  token: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  vinCode: string;
  brand: string;
  model: string;
  series?: string;
  manufactureYear?: number;
  color?: string;
  mileage: number;
  ownerName?: string;
  ownerPhone?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceMileage?: number;
  createdAt: string;
}

export type WorkOrderStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Rework';
export const WorkOrderStatusText: Record<WorkOrderStatus, string> = {
  Pending: '待处理',
  InProgress: '进行中',
  Completed: '已完成',
  Cancelled: '已取消',
  Rework: '返修中',
};

export interface WorkOrderItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  laborCost: number;
  isCompleted: boolean;
  partId?: string;
  partName?: string;
}

export interface Diagnosis {
  id: string;
  vehicleId: string;
  vehicleLicensePlate?: string;
  workOrderId?: string;
  workOrderNumber?: string;
  diagnosedByUserId: string;
  diagnosedByUserName?: string;
  symptomDescription: string;
  diagnosticResult: string;
  faultCodes?: string;
  recommendations?: string;
  diagnosedAt: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  vehicleId: string;
  vehicleLicensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  status: WorkOrderStatus;
  statusText: string;
  description?: string;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  isRework: boolean;
  originalOrderId?: string;
  createdAt: string;
  items: WorkOrderItem[];
  diagnoses: Diagnosis[];
}

export type RiskLevel = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
export const RiskLevelText: Record<RiskLevel, string> = {
  None: '正常',
  Low: '低风险',
  Medium: '中风险',
  High: '高风险',
  Critical: '紧急',
};

export const RiskLevelColor: Record<RiskLevel, string> = {
  None: 'bg-green-100 text-green-800',
  Low: 'bg-blue-100 text-blue-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
};

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  brand?: string;
  specification?: string;
  category?: string;
  unitPrice: number;
  quantityInStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  riskLevel: RiskLevel;
  riskLevelText: string;
}

export interface CommunicationLog {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId?: string;
  toUserName?: string;
  message: string;
  attachmentUrl?: string;
  sentAt: string;
}

export interface StockAlert {
  id: string;
  partInventoryId: string;
  partName: string;
  partNumber: string;
  riskLevel: RiskLevel;
  riskLevelText: string;
  alertMessage: string;
  isAcknowledged: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  communicationLogs: CommunicationLog[];
  reviewOpinions: ReviewOpinion[];
}

export type QuoteStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Expired';
export const QuoteStatusText: Record<QuoteStatus, string> = {
  Draft: '草稿',
  PendingApproval: '待审批',
  Approved: '已批准',
  Rejected: '已拒绝',
  Expired: '已过期',
};

export interface QuoteItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  laborCost: number;
  isPart: boolean;
  partId?: string;
  partName?: string;
}

export interface ReviewOpinion {
  id: string;
  reviewerUserId: string;
  reviewerUserName: string;
  opinion: string;
  isApproved: boolean;
  reviewedAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  createdByUserId: string;
  createdByUserName: string;
  status: QuoteStatus;
  statusText: string;
  partsTotal: number;
  laborTotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  customerNotes?: string;
  internalNotes?: string;
  validUntil?: string;
  createdAt: string;
  items: QuoteItem[];
  reviewOpinions: ReviewOpinion[];
  communicationLogs: CommunicationLog[];
}

export interface ReworkRate {
  date: string;
  totalOrders: number;
  reworkOrders: number;
  reworkRate: number;
}

export interface DashboardStats {
  todayPendingOrders: number;
  todayInProgress: number;
  todayCompleted: number;
  lowStockAlerts: number;
  criticalStockAlerts: number;
  thisMonthReworkRate: number;
  reworkTrend: ReworkRate[];
}
