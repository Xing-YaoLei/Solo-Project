export interface BaseResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PaginationParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
  start_date?: string
  end_date?: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: string
  department: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Token {
  access_token: string
  token_type: string
  user: User
}

export interface UserLogin {
  username: string
  password: string
}

export interface Contract {
  id: number
  contract_no: string
  project_name: string
  client_name: string
  client_phone?: string
  address?: string
  house_type?: string
  area?: number
  contract_amount: number
  sign_date?: string
  start_date?: string
  end_date?: string
  status: string
  manager_id?: number
  sales_id?: number
  designer_id?: number
  remark?: string
  attachments?: ContractAttachment[]
  created_at: string
  updated_at: string
}

export interface ContractAttachment {
  id: number
  contract_id: number
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  uploaded_by?: number
  category?: string
  is_contract: boolean
  created_at: string
  updated_at: string
}

export interface ReconciliationDiff {
  id: number
  contract_id: number
  bill_id?: number
  diff_no: string
  diff_type: string
  expected_amount: number
  actual_amount: number
  diff_amount: number
  status: string
  handled_by?: number
  handled_at?: string
  handler_conclusion?: string
  remark?: string
  created_at: string
  updated_at: string
}

export interface Bill {
  id: number
  contract_id: number
  bill_no: string
  bill_type: string
  bill_name: string
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  status: string
  due_date?: string
  paid_date?: string
  created_by?: number
  verified_by?: number
  verified_at?: string
  remark?: string
  items?: BillItem[]
  approval_records?: ApprovalRecord[]
  created_at: string
  updated_at: string
}

export interface BillItem {
  id: number
  bill_id: number
  item_name: string
  item_code?: string
  specification?: string
  unit?: string
  quantity: number
  unit_price: number
  subtotal: number
  discount_rate: number
  actual_amount: number
  remark?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ApprovalNode {
  id: number
  node_name: string
  node_code: string
  approver_role?: string
  approver_id?: number
  approval_type: string
  sort_order: number
  is_active: number
  description?: string
  created_at: string
  updated_at: string
}

export interface ApprovalRecord {
  id: number
  bill_id: number
  node_id: number
  approver_id: number
  approval_status: string
  approval_opinion?: string
  approved_at?: string
  sort_order: number
  created_at: string
  updated_at: string
  approver?: User
  node?: ApprovalNode
}

export interface ExceptionOrder {
  id: number
  contract_id?: number
  bill_id?: number
  reconciliation_diff_id?: number
  exception_no: string
  exception_type: string
  title: string
  description?: string
  expected_amount?: number
  actual_amount?: number
  diff_amount?: number
  status: string
  priority: string
  handler_id?: number
  supervisor_id?: number
  final_conclusion?: string
  closed_at?: string
  remark?: string
  affected_objects?: ExceptionAffectedObject[]
  handler?: User
  supervisor?: User
  contract?: Contract
  bill?: Bill
  created_at: string
  updated_at: string
}

export interface ExceptionAffectedObject {
  id: number
  exception_order_id: number
  object_type: string
  object_id: number
  object_name: string
  object_no?: string
  impact_level: string
  impact_description?: string
  created_at: string
  updated_at: string
}

export interface StatusTimeline {
  id: number
  contract_id?: number
  bill_id?: number
  reconciliation_diff_id?: number
  exception_order_id?: number
  status: string
  previous_status?: string
  operator_id?: number
  operation_type: string
  remark?: string
  operator?: User
  created_at: string
}

export interface ExportRecord {
  id: number
  export_type: string
  export_name: string
  file_name: string
  file_path: string
  file_size?: number
  data_caliber: string
  filter_conditions?: string
  record_count?: number
  exported_by?: number
  remark?: string
  created_at: string
  updated_at: string
}

export interface AmountValidationRequest {
  contract_id: number
  bill_id?: number
  expected_amount: number
  actual_amount: number
  description?: string
}

export interface AmountValidationResult {
  is_valid: boolean
  diff_amount: number
  diff_percentage: number
  threshold: number
  needs_exception: boolean
  message: string
}

export interface ExportRequest {
  export_type: string
  export_name: string
  filter_conditions?: Record<string, any>
  data_caliber?: string
  include_caliber: boolean
}

export type ExportType = 'contracts' | 'bills' | 'reconciliation' | 'exceptions' | 'all'
