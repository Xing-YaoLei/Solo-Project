export type UserRole = 'ADMIN' | 'MANAGER' | 'PHARMACIST' | 'CLERK';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'COMPLETED' | 'ESCALATED';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  storeId: string;
  storeName: string;
}

export interface ReplenishmentOrder {
  id: string;
  orderNo: string;
  storeId: string;
  storeName: string;
  drugName: string;
  drugSpec: string;
  manufacturer: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  orderDate: string;
  status: string;
}

export interface InsuranceRecord {
  id: string;
  transactionNo: string;
  patientName: string;
  patientId: string;
  insuranceType: string;
  drugName: string;
  quantity: number;
  amount: number;
  transactionDate: string;
  replenishmentOrderId: string;
}

export interface PrescriptionPhoto {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  isClear: boolean;
  riskLevel: RiskLevel;
  replenishmentOrderId: string;
  ocrText?: string;
}

export interface FollowUpTask {
  id: string;
  taskNo: string;
  replenishmentOrderId: string;
  orderNo: string;
  drugName: string;
  assigneeId: string;
  assigneeName: string;
  status: TaskStatus;
  riskLevel: RiskLevel;
  storeId: string;
  storeName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  hasInsuranceRecord: boolean;
  hasPrescriptionPhoto: boolean;
  hasPharmacistOpinion: boolean;
  hasBatchExpiry: boolean;
  insuranceRecord?: InsuranceRecord;
  prescriptionPhoto?: PrescriptionPhoto;
  pharmacistOpinion?: PharmacistOpinion;
  batchExpiry?: BatchExpiryRecord;
  reviewNotes?: ReviewNote[];
}

export interface PharmacistOpinion {
  id: string;
  followUpTaskId: string;
  pharmacistId: string;
  pharmacistName: string;
  opinion: string;
  isApproved: boolean;
  reviewedAt: string;
}

export interface BatchExpiryRecord {
  id: string;
  followUpTaskId: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  shelfLife: string;
  verifiedBy: string;
  verifiedAt: string;
}

export interface ReviewNote {
  id: string;
  followUpTaskId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  type: 'REVIEW' | 'COMMUNICATION';
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  escalatedTasks: number;
  completionRate: number;
  trendData: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  completed: number;
  created: number;
}
