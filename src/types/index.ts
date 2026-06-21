export type UserRole = 'operator' | 'customer_service' | 'rider' | 'city_manager' | 'frontline'

export type RouteType = 'short' | 'medium' | 'long' | 'cross_district'
export type RuleStatus = 'draft' | 'pending_approval' | 'active' | 'expired' | 'rejected'
export type AppealStatus = 'pending' | 'reviewing' | 'supplement_needed' | 'approved' | 'rejected' | 'transferred' | 'escalated'
export type FlowAction = 'created' | 'submitted' | 'reviewing' | 'reviewed' | 'claimed' | 'supplement_requested' | 'supplement_uploaded' | 'approved' | 'rejected' | 'transferred' | 'escalated' | 'resolved' | 'closed'
export type SettlementBatchStatus = 'draft' | 'reviewing' | 'approved' | 'paid'
export type SettlementDetailStatus = 'pending' | 'confirmed' | 'paid'
export type CompensationCategory = 'damage' | 'loss' | 'delay' | 'service_failure'
export type CompensationRecordStatus = 'pending' | 'approved' | 'paid' | 'rejected'
export type TodoPriority = 'urgent' | 'high' | 'medium' | 'low'
export type TodoStatus = 'pending' | 'claimed' | 'in_progress' | 'supplement_requested' | 'supplement_needed' | 'rejected' | 'transferred' | 'resolved' | 'closed'
export type TodoSourceType = 'damage_report' | 'damage' | 'appeal' | 'compensation' | 'settlement_dispute' | 'other'
export type TicketType = 'appeal' | 'compensation' | 'todo'

export interface User {
  id: string
  username: string
  display_name: string
  role: UserRole
  city_code: string
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  rider_id: string
  city_code: string
  route_type: RouteType
  distance_km: number
  original_subsidy: number
  created_at: string
}

export interface SubsidyRule {
  id: string
  name: string
  city_code: string
  route_type: RouteType
  distance_min_km: number
  distance_max_km: number
  amount_per_km: number
  max_amount: number
  status: RuleStatus
  effective_from: string
  effective_to: string
  created_by: string
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface SubsidyRuleCreate {
  name: string
  city_code: string
  route_type: RouteType
  distance_min_km: number
  distance_max_km: number
  amount_per_km: number
  max_amount: number
  effective_from: string
  effective_to: string
}

export interface AppealTicket {
  id: string
  order_id: string
  rider_id: string
  subsidy_rule_id: string
  original_amount: number
  claimed_amount: number
  reason: string
  status: AppealStatus
  handler_id: string | null
  photos: AppealPhoto[]
  logs: FlowLog[]
  created_at: string
  updated_at: string
}

export interface AppealPhoto {
  id: string
  appeal_id: string
  url: string
  ocr_text: string | null
  uploaded_at: string
}

export interface FlowLog {
  id: string
  ticket_id: string
  action: FlowAction
  operator_id: string
  operator_role: string
  comment: string
  created_at: string
}

export interface SettlementBatch {
  id: string
  city_code: string
  period_start: string
  period_end: string
  total_amount: number
  total_count: number
  status: SettlementBatchStatus
  created_by: string
  approved_by: string | null
  created_at: string
}

export interface SettlementDetail {
  id: string
  batch_id: string
  rider_id: string
  order_id: string
  subsidy_rule_id: string
  calculated_amount: number
  adjusted_amount: number | null
  final_amount: number
  status: SettlementDetailStatus
  created_at: string
}

export interface CompensationType {
  id: string
  name: string
  category: CompensationCategory
  standard_amount: number
  max_amount: number
  requires_photo: boolean
  approval_required: boolean
  is_active: boolean
}

export interface CompensationRecord {
  id: string
  type_id: string
  order_id: string
  rider_id: string
  amount: number
  reason: string
  status: CompensationRecordStatus
  approved_by: string | null
  created_at: string
}

export interface VerificationPhoto {
  id: string
  ticket_id: string
  ticket_type: TicketType
  url: string
  remark: string
  uploaded_by: string
  uploaded_at: string
}

export interface TodoTicket {
  id: string
  source_type: TodoSourceType
  source_id: string
  title: string
  priority: TodoPriority
  status: TodoStatus
  assignee_id: string | null
  transfer_from: string | null
  transfer_reason: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface TransferRequest {
  target_user_id: string
  reason: string
}

export interface RejectRequest {
  reason: string
  attachments?: string[]
}

export interface SupplementRequest {
  comment: string
  photo_ids: string[]
}

export interface ReportFilter {
  start_date: string
  end_date: string
  city_code?: string
  handler_id?: string
  group_by: 'date' | 'city' | 'handler' | 'route_type'
}

export interface DispatchDurationReport {
  group_key: string
  avg_dispatch_minutes: number
  median_dispatch_minutes: number
  p95_dispatch_minutes: number
  order_count: number
  subsidy_total: number
}

export interface PerformanceReport {
  handler_id: string
  handler_name: string
  total_handled: number
  avg_handling_minutes: number
  rejection_rate: number
  transfer_rate: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
