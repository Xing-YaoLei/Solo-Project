export type UserRole = 'admin' | 'worker';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  phone?: string;
  avatar_url?: string;
  last_login_at?: string;
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
  month: string;
  district: string;
  avg_water: number;
  avg_electricity: number;
  avg_gas: number;
  count: number;
}

export interface InspectionFunnelData {
  stage: string;
  count: number;
  conversion_rate: number;
}

export interface PaymentRankingData {
  period: string;
  dimension: string;
  key: string;
  total_amount: number;
  transaction_count: number;
}

export interface ComplaintTagsData {
  month: string;
  tag: string;
  count: number;
}

export interface RepairDurationData {
  worker_id?: number;
  worker_name?: string;
  repair_type?: string;
  avg_duration: number;
  median_duration: number;
  total_orders: number;
  caliber_version: string;
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
  id: number;
  version: string;
  effective_date: string;
  description?: string;
  calculation_rule?: string;
  is_active: boolean;
  created_at: string;
  end_date?: string;
  exclude_holidays?: boolean;
  exclude_weekends?: boolean;
  start_event?: string;
  end_event?: string;
  created_by?: number;
}

export interface ImportBatch {
  id: number;
  batch_no: string;
  import_type: string;
  file_name?: string;
  total_count: number;
  success_count: number;
  failed_count: number;
  status: string;
  imported_by?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  file_size?: number;
}

export interface RepairOrder {
  id: number;
  repair_no: string;
  property_id: number;
  reporter_id: number;
  worker_id?: number;
  repair_type: string;
  description?: string;
  report_time: string;
  assign_time?: string;
  start_time?: string;
  complete_time?: string;
  status: string;
  duration_hours?: number;
  caliber_version?: string;
  batch_id?: number;
  title?: string;
  actual_cost?: number;
  remark?: string;
  created_at: string;
}
