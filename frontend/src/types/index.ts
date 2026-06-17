export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface KPIData {
  inspectionCount: number;
  paymentTotal: number;
  avgRepairDuration: number;
  complaintCount: number;
  inspectionCountTrend?: number;
  paymentTotalTrend?: number;
  avgRepairDurationTrend?: number;
  complaintCountTrend?: number;
}

export interface WaterElectricityData {
  date: string;
  water: number;
  electricity: number;
  area: string;
}

export interface InspectionFunnelData {
  name: string;
  value: number;
}

export interface PaymentRankingData {
  name: string;
  amount: number;
  area: string;
}

export interface ComplaintTagsData {
  date: string;
  noise: number;
  hygiene: number;
  facilities: number;
  safety: number;
  other: number;
}

export interface RepairDurationData {
  date: string;
  workerName: string;
  duration: number;
  type: string;
  status: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AreaFilter {
  area?: string;
  areas?: string[];
}

export interface PaymentRecord {
  id: string;
  payer: string;
  amount: number;
  date: string;
  status: 'paid' | 'overdue' | 'pending';
  type: string;
  area: string;
  comment?: string;
  isOverdue: boolean;
  overdueDays?: number;
}

export interface CaliberVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  effectiveDate: string;
  createTime: string;
  creator: string;
  changes: string[];
}

export interface ImportBatch {
  id: string;
  name: string;
  type: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  createTime: string;
  creator: string;
  file?: string;
}

export interface RepairOrder {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  workerName: string;
  createTime: string;
  completeTime?: string;
  duration?: number;
  area: string;
  description: string;
}
