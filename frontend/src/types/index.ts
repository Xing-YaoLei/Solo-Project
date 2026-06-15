// ========== 与后端 schemas.py 1:1 字段对齐 ==========

export interface User {
  id?: number
  username?: string
  full_name?: string
  email?: string | null
  role?: string
  is_active?: boolean
  created_at?: string
  [key: string]: any
}

export interface MemberProfile {
  id?: number
  member_no?: string
  name?: string
  phone?: string | null
  email?: string | null
  id_card?: string | null
  level?: string // MemberLevel 枚举值
  source_channel?: string // TicketSource 枚举值
  join_date?: string | null
  exam_score?: number | null
  exam_pass_status?: boolean | null
  exam_date?: string | null
  total_learning_hours?: number
  community_group?: string | null
  tags?: string[]
  remark?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface BenefitRule {
  id?: number
  rule_code?: string
  rule_name?: string
  description?: string | null
  benefit_type?: string | null
  applicable_levels?: string[]
  discount_rate?: number
  bonus_points?: number
  cash_value?: number
  valid_from?: string | null
  valid_until?: string | null
  is_active?: boolean
  conditions?: Record<string, any>
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface MemberBenefitMapping {
  id?: number
  member_id?: number
  benefit_id?: number
  granted_date?: string | null
  used_count?: number
  max_usage?: number
  is_active?: boolean
  remark?: string | null
  benefit?: BenefitRule | null
  [key: string]: any
}

export interface AccountTransaction {
  id?: number
  transaction_no?: string
  member_id?: number
  ticket_id?: number | null
  type?: string // TransactionType 枚举值
  amount?: number
  balance_after?: number | null
  payment_method?: string | null
  related_order_no?: string | null
  description?: string | null
  evidence_urls?: string[]
  transaction_date?: string
  operator_id?: number | null
  created_at?: string
  [key: string]: any
}

export interface AuditLog {
  id?: number
  ticket_id?: number
  operator_id?: number
  action?: string
  old_status?: string | null
  new_status?: string | null
  comment?: string | null
  evidence_urls?: string[]
  reference_ids?: number[]
  operator?: User | null
  created_at?: string
  [key: string]: any
}

export interface ReviewRecord {
  id?: number
  ticket_id?: number
  reviewer_id?: number
  round?: number
  is_escalated?: boolean
  review_tag?: string | null // ReviewTag 枚举值
  score?: number | null
  summary?: string | null
  evidence_urls?: string[]
  cited_transaction_ids?: number[]
  cited_benefit_ids?: number[]
  follow_up_actions?: string[]
  reviewer?: User | null
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface TicketBenefitReference {
  id?: number
  ticket_id?: number
  benefit_id?: number
  applied_value?: number
  remark?: string | null
  applied_date?: string
  benefit?: BenefitRule | null
  [key: string]: any
}

export interface CommunityTicket {
  id?: number
  ticket_no?: string
  title?: string
  member_id?: number
  source?: string // TicketSource 枚举值
  category?: string | null
  priority?: number
  description?: string | null
  evidence_urls?: string[]
  responsible_id?: number | null
  status?: string // TicketStatus 枚举值
  creator_id?: number | null
  creator?: User | null
  responsible?: User | null
  member?: MemberProfile | null
  supplement_requirements?: string | null
  closed_at?: string | null
  close_remark?: string | null
  review_tag?: string | null // ReviewTag 枚举值
  review_score?: number | null
  review_remark?: string | null
  created_at?: string
  updated_at?: string
  audit_logs?: AuditLog[]
  review_records?: ReviewRecord[]
  transactions?: AccountTransaction[]
  benefit_references?: TicketBenefitReference[]
  [key: string]: any
}

export interface PlagiarismCase {
  id?: number
  case_no?: string
  member_id?: number
  ticket_id?: number | null
  assignment_name?: string
  course_name?: string | null
  similarity_score?: number | null
  original_author?: string | null
  description?: string | null
  evidence_urls?: string[]
  severity?: string // PlagiarismSeverity 枚举值
  status?: string // PlagiarismStatus 枚举值
  reporter_id?: number | null
  handler_id?: number | null
  investigation_notes?: string | null
  resolution?: string | null
  punishment?: string | null
  appeal_deadline?: string | null
  resolved_at?: string | null
  created_at?: string
  updated_at?: string
  member?: MemberProfile | null
  [key: string]: any
}

// ========== 列表响应包装 ==========

export interface ListResponse<T> {
  total: number
  items: T[]
}

export type MemberProfileListResponse = ListResponse<MemberProfile>
export type BenefitRuleListResponse = ListResponse<BenefitRule>
export type AccountTransactionListResponse = ListResponse<AccountTransaction>
export type CommunityTicketListResponse = ListResponse<CommunityTicket>
export type PlagiarismCaseListResponse = ListResponse<PlagiarismCase>

// ========== 请求体（提交用） ==========

export interface CommunityTicketCreatePayload {
  ticket_no?: string
  title: string
  member_id: number
  source?: string // TicketSource
  category?: string
  priority?: number
  description?: string
  evidence_urls?: string[]
  responsible_id?: number
  benefit_ids?: number[]
}

export interface CommunityTicketUpdatePayload {
  title?: string
  source?: string
  category?: string
  priority?: number
  description?: string
  evidence_urls?: string[]
  responsible_id?: number
}

export interface TicketStatusUpdatePayload {
  new_status: string // TicketStatus
  comment?: string
  evidence_urls?: string[]
  supplement_requirements?: string
  close_remark?: string
}

export interface TicketReviewCreatePayload {
  review_tag: string // ReviewTag
  score?: number
  summary?: string
  evidence_urls?: string[]
  cited_transaction_ids?: number[]
  cited_benefit_ids?: number[]
  follow_up_actions?: string[]
  is_escalated?: boolean
}

export interface PlagiarismCaseCreatePayload {
  member_id: number
  ticket_id?: number
  assignment_name: string
  course_name?: string
  similarity_score?: number
  original_author?: string
  description?: string
  evidence_urls?: string[]
  severity?: string // PlagiarismSeverity
}

export interface PlagiarismCaseUpdatePayload {
  status?: string // PlagiarismStatus
  severity?: string
  similarity_score?: number
  investigation_notes?: string
  resolution?: string
  punishment?: string
  appeal_deadline?: string
}

export interface PlagiarismStatusUpdatePayload {
  status: string // PlagiarismStatus
  comment?: string
  handler_id?: number
}

// ========== 汇总统计 ==========

export interface SummaryStats {
  total_tickets: number
  draft_count: number
  pending_review_count: number
  supplement_needed_count: number
  escalated_review_count: number
  processing_count: number
  completed_count: number
  closed_count: number
  total_members: number
  exam_pass_rate: number
  plagiarism_cases_count: number
  open_plagiarism_count: number
}

export interface SourceChannelStats {
  source: string // TicketSource
  count: number
  percentage: number
  exam_pass_rate?: number | null
  [key: string]: any
}

export interface ResponsibleStats {
  responsible_id: number
  responsible_name: string
  total: number
  completed: number
  completion_rate: number
  [key: string]: any
}

export interface ReviewTagStats {
  tag: string // ReviewTag
  count: number
  percentage: number
  [key: string]: any
}

export interface ExamStats {
  total_examined: number
  passed_count: number
  failed_count: number
  pass_rate: number
  average_score?: number | null
  by_level?: Record<string, Record<string, any>>
  [key: string]: any
}

export interface FullSummaryResponse {
  overview: SummaryStats
  by_source: SourceChannelStats[]
  by_responsible: ResponsibleStats[]
  by_review_tag: ReviewTagStats[]
  exam_stats: ExamStats
}
