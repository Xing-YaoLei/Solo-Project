export interface User {
  id?: number
  username?: string
  phone?: string
  email?: string
  role?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export interface MemberProfile {
  id?: number
  user_id?: number
  member_level?: string
  real_name?: string
  id_card?: string
  phone?: string
  total_revenue?: number
  commission_balance?: number
  join_date?: string
  referrer_id?: number
  referral_code?: string
  created_at?: string
  updated_at?: string
}

export interface BenefitRule {
  id?: number
  name?: string
  code?: string
  description?: string
  benefit_type?: string
  value?: number
  value_type?: string
  applicable_levels?: string[]
  min_amount?: number
  max_amount?: number
  effective_start?: string
  effective_end?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface MemberBenefitMapping {
  id?: number
  member_id?: number
  benefit_id?: number
  benefit_name?: string
  granted_at?: string
  expires_at?: string
  used_at?: string
  status?: string
  created_at?: string
}

export interface AccountTransaction {
  id?: number
  member_id?: number
  transaction_type?: string
  amount?: number
  balance_after?: number
  related_ticket_id?: number
  related_plagiarism_id?: number
  description?: string
  operator_id?: number
  operator_name?: string
  created_at?: string
}

export interface CommunityTicket {
  id?: number
  ticket_no?: string
  title?: string
  source?: string
  submitter_id?: number
  submitter_name?: string
  submitter_phone?: string
  referrer_id?: number
  referrer_name?: string
  amount?: number
  content?: string
  evidence_urls?: string[]
  status?: string
  current_reviewer_id?: number
  current_reviewer_name?: string
  responsible_person_id?: number
  responsible_person_name?: string
  review_tags?: string[]
  final_score?: number
  review_deadline?: string
  is_exam_needed?: boolean
  exam_status?: string
  exam_started_at?: string
  exam_finished_at?: string
  violation_type?: string
  violation_description?: string
  violation_amount?: number
  completed_at?: string
  closed_at?: string
  closed_reason?: string
  created_at?: string
  updated_at?: string
}

export interface AuditLog {
  id?: number
  ticket_id?: number
  operator_id?: number
  operator_name?: string
  action?: string
  old_status?: string
  new_status?: string
  remark?: string
  created_at?: string
}

export interface ReviewRecord {
  id?: number
  ticket_id?: number
  reviewer_id?: number
  reviewer_name?: string
  review_round?: number
  review_tags?: string[]
  score?: number
  comment?: string
  is_passed?: boolean
  need_supplement?: boolean
  supplement_instruction?: string
  escalate_reason?: string
  created_at?: string
}

export interface TicketBenefitReference {
  id?: number
  ticket_id?: number
  benefit_id?: number
  benefit_name?: string
  applied_amount?: number
  created_at?: string
}

export interface PlagiarismCase {
  id?: number
  case_no?: string
  reported_by?: number
  reporter_name?: string
  reported_member_id?: number
  reported_member_name?: string
  ticket_id?: number
  title?: string
  description?: string
  evidence_urls?: string[]
  status?: string
  severity?: string
  investigator_id?: number
  investigator_name?: string
  deduction_points?: number
  deduction_amount?: number
  result_description?: string
  appealed?: boolean
  appeal_reason?: string
  appeal_result?: string
  resolved_at?: string
  created_at?: string
  updated_at?: string
}

export interface SummaryStats {
  total_tickets?: number
  pending_count?: number
  processing_count?: number
  completed_count?: number
  closed_count?: number
  total_amount?: number
  paid_amount?: number
  exam_count?: number
  exam_pass_count?: number
  violation_count?: number
  violation_amount?: number
}

export interface SourceChannelStats {
  source?: string
  count?: number
  amount?: number
  ratio?: number
}

export interface ResponsibleStats {
  person_id?: number
  person_name?: string
  total_count?: number
  completed_count?: number
  pending_count?: number
  avg_processing_days?: number
}

export interface ReviewTagStats {
  tag?: string
  count?: number
  ratio?: number
}

export interface ExamStats {
  total_exams?: number
  passed?: number
  failed?: number
  in_progress?: number
  pass_rate?: number
  avg_duration_minutes?: number
}

export interface FullSummaryResponse {
  summary?: SummaryStats
  source_channels?: SourceChannelStats[]
  responsible_persons?: ResponsibleStats[]
  review_tags?: ReviewTagStats[]
  exams?: ExamStats
  generated_at?: string
}
