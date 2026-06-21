export type UserRole = 'partner' | 'lawyer' | 'assistant' | 'client';

export type CaseStatus = 'active' | 'pending' | 'closed' | 'cancelled';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export type InvoiceSource = 'manual' | 'email' | 'import' | 'api';

export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export type PaymentCycleType = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly' | 'milestone';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export type ReportType = 'case_summary' | 'revenue_analysis' | 'collection_forecast' | 'approval_status' | 'lawyer_performance';

export type ReportFormat = 'json' | 'csv' | 'excel' | 'pdf';

export type ExportFormat = 'excel' | 'csv' | 'pdf' | 'parquet';

export type ExportType = 'cases' | 'invoices' | 'payments' | 'approvals' | 'full_report';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Case {
  id: string;
  case_no: string;
  name: string;
  lawyer_id: string;
  client_id: string;
  case_type: string;
  quoted_amount: number;
  actual_amount: number;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  lawyer?: User;
  client?: User;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  fee_type: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  case_id: string;
  amount: number;
  status: InvoiceStatus;
  invoice_date: string;
  source: InvoiceSource;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
  case?: Case;
}

export interface PaymentSchedule {
  id: string;
  case_id: string;
  phase: number;
  phase_name: string;
  amount: number;
  due_date: string;
  actual_payment_date?: string;
  status: PaymentStatus;
  payment_cycle_type: PaymentCycleType;
  case?: Case;
}

export interface ApprovalNode {
  id: string;
  case_id: string;
  node_name: string;
  approver_id: string;
  order_index: number;
  submit_time: string;
  expected_complete_time: string;
  actual_complete_time?: string;
  status: ApprovalStatus;
  reason?: string;
  case?: Case;
  approver?: User;
}

export interface ReportRequest {
  report_type: ReportType;
  start_date?: string;
  end_date?: string;
  case_id?: string;
  lawyer_id?: string;
  parameters?: Record<string, unknown>;
}

export interface ReportData {
  report_type: ReportType;
  generated_at: string;
  period_start?: string;
  period_end?: string;
  summary: Record<string, unknown>;
  details: Record<string, unknown>[];
}

export interface ReportResponse {
  report_id: string;
  report_type: ReportType;
  status: string;
  generated_at: string;
  download_url?: string;
  expires_at?: string;
}

export interface RevenueByPeriod {
  period: string;
  quoted_amount: number;
  actual_amount: number;
  invoiced_amount: number;
  collected_amount: number;
}

export interface CaseStatusSummary {
  status: string;
  count: number;
  total_amount: number;
}

export interface LawyerPerformance {
  lawyer_id: string;
  lawyer_name: string;
  case_count: number;
  total_revenue: number;
  collection_rate: number;
  avg_approval_days: number;
}

export interface CollectionForecast {
  due_date: string;
  expected_amount: number;
  overdue_amount: number;
  case_id: string;
  case_name: string;
}

export interface ShareLinkCreate {
  resource_type: string;
  resource_id?: string;
  allowed_roles: UserRole[];
  expires_in_hours: number;
  allow_export: boolean;
  hide_sensitive: boolean;
}

export interface ShareLinkUpdate {
  allowed_roles?: UserRole[];
  expires_in_hours?: number;
  allow_export?: boolean;
  hide_sensitive?: boolean;
  is_active?: boolean;
}

export interface ShareLink {
  id: string;
  token: string;
  resource_type: string;
  resource_id?: string;
  allowed_roles: UserRole[];
  expires_at: string;
  allow_export: boolean;
  hide_sensitive: boolean;
  access_count: number;
  is_active: boolean;
  created_at: string;
  share_url: string;
}

export interface ShareLinkListItem {
  id: string;
  token: string;
  resource_type: string;
  resource_id?: string;
  expires_at: string;
  access_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ShareAccessRequest {
  token: string;
}

export interface ShareAccessResponse {
  valid: boolean;
  resource_type?: string;
  resource_id?: string;
  allow_export: boolean;
  hide_sensitive: boolean;
  expires_at?: string;
  data?: unknown;
}

export interface ExportRequest {
  export_type: ExportType;
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
  case_ids?: string[];
  include_attachments: boolean;
  hide_sensitive: boolean;
}

export interface ExportResponse {
  export_id: string;
  export_type: ExportType;
  format: ExportFormat;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  file_name?: string;
  file_size?: number;
  download_url?: string;
  error_message?: string;
}

export interface ExportProgress {
  export_id: string;
  status: string;
  progress: number;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ReconciliationTrendItem {
  date: string;
  quoted_amount: number;
  actual_amount: number;
  difference: number;
  difference_rate: number;
}

export interface ContractAttachmentItem {
  type: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface InvoiceDetailItem {
  invoice_no: string;
  case_name: string;
  invoice_date: string;
  amount: number;
  status: InvoiceStatus;
  source: InvoiceSource;
}

export interface ApprovalNodeExceptionItem {
  node_name: string;
  case_name: string;
  approver_name: string;
  submit_time: string;
  expected_complete_time: string;
  delay_days: number;
  status: ApprovalStatus;
}

export interface ChartDataResponse<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DateRange {
  start_date?: string;
  end_date?: string;
}

export interface FilterParams {
  date_range?: DateRange;
  case_type?: string;
  lawyer_id?: string;
  status?: string;
}
