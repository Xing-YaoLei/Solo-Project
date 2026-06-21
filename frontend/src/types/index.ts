export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export type UserRole = 'admin' | 'manager' | 'lawyer' | 'assistant' | 'auditor'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '业务经理',
  lawyer: '律师',
  assistant: '助理',
  auditor: '审核员',
}

export type DocumentStatus =
  | 'draft'
  | 'interacting'
  | 'risk_checked'
  | 'version_verified'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived'

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: '草稿',
  interacting: '互动中',
  risk_checked: '风险检测完成',
  version_verified: '版本核对完成',
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已退回',
  archived: '已归档',
}

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: '#9ca3af',
  interacting: '#3b82f6',
  risk_checked: '#8b5cf6',
  version_verified: '#06b6d4',
  pending_review: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  archived: '#6b7280',
}

export type DocumentType =
  | 'contract'
  | 'notice'
  | 'agreement'
  | 'legal_opinion'
  | 'power_of_attorney'
  | 'other'

export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  contract: '合同',
  notice: '通知函',
  agreement: '协议',
  legal_opinion: '法律意见书',
  power_of_attorney: '授权委托书',
  other: '其他',
}

export interface Interaction {
  id: number
  document_id: number
  user_id: number
  interaction_type: string
  content: string
  participants: string[]
  attachments: any[]
  created_at: string
}

export interface RiskHit {
  id: number
  document_id: number
  keyword: string
  context: string | null
  position_start: number | null
  position_end: number | null
  severity: string
  suggestion: string | null
  created_at: string
}

export interface AuditRecord {
  id: number
  document_id: number
  auditor_id: number
  action: string
  previous_status: string | null
  new_status: string | null
  comments: string | null
  material_tags_suggestion: string[]
  created_at: string
}

export interface Document {
  id: number
  title: string
  document_no: string | null
  document_type: DocumentType
  status: DocumentStatus
  content: string
  summary: string | null
  client_name: string | null
  case_no: string | null
  creator_id: number | null
  assignee_id: number | null
  current_version: number
  is_version_verified: boolean
  risk_level: string | null
  material_tags: string[]
  review_comments: string | null
  rejection_count: number
  created_at: string
  updated_at: string
  approved_at: string | null
  archived_at: string | null
}

export interface DocumentVersion {
  id: number
  document_id: number
  version_number: number
  title: string
  content: string
  change_summary: string | null
  created_by: number | null
  created_at: string
}

export interface DocumentDetail extends Document {
  versions: DocumentVersion[]
  interactions: Interaction[]
  audit_records: AuditRecord[]
}

export type InteractionType =
  | 'client_call'
  | 'client_email'
  | 'client_meeting'
  | 'internal_discussion'
  | 'revision_note'
  | 'other'

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  client_call: '客户电话',
  client_email: '客户邮件',
  client_meeting: '客户会议',
  internal_discussion: '内部讨论',
  revision_note: '修改备注',
  other: '其他',
}

export interface DashboardData {
  total: number
  by_status: Record<string, number>
  rejected: number
  pending_review: number
  my_todo: number
  recent_documents: RecentDocument[]
}

export interface RecentDocument {
  id: number
  title: string
  status: DocumentStatus
  rejection_count: number
  updated_at: string
  assignee: string | null
}
