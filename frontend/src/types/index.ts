export type ComplaintStatus = 'pending' | 'processing' | 'missing_materials' | 'under_review' | 'completed' | 'closed'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type SourceChannel = '电话' | '微信' | '平台' | '现场'
export type Satisfaction = '非常满意' | '满意' | '一般' | '不满意'
export type ResponsibleType = '员工' | '供应商' | '管理' | '客人自身'
export type TagName = '卫生' | '服务' | '设施' | '安全' | '噪音' | '价格' | '其他'

export interface Complaint {
  id: string
  title: string
  description: string
  source_channel: SourceChannel
  status: ComplaintStatus
  priority: Priority
  complainant_name: string
  complainant_contact: string
  homestay_name: string
  room_number: string
  check_in_date: string
  check_out_date: string | null
  handler_id: string | null
  handler_name?: string | null
  created_at: string
  updated_at: string | null
  closed_at: string | null
  tags: string[]
  visit_results: VisitResult[]
  responsibilities: Responsibility[]
  handling_records: HandlingRecord[]
  reviews: Review[]
}

export interface ComplaintListItem {
  id: string
  title: string
  status: ComplaintStatus
  priority: Priority
  source_channel: SourceChannel
  homestay_name: string
  handler_name: string | null
  created_at: string
  closed_at: string | null
  tags: string[]
}

export interface VisitResult {
  id: string
  complaint_id: string
  visit_method: string
  visitor_name: string
  satisfaction: Satisfaction
  feedback: string | null
  visit_at: string
}

export interface Responsibility {
  id: string
  complaint_id: string
  responsible_type: ResponsibleType
  responsible_person: string
  judgment_basis: string | null
  determined_by: string
  determined_at: string
}

export interface Review {
  id: string
  complaint_id: string
  review_tags: string
  summary: string
  improvement_measures: string | null
  reviewer_name: string
  reviewed_at: string
}

export interface HandlingRecord {
  id: string
  complaint_id: string
  handler_id: string | null
  handler_name: string | null
  action: string
  description: string
  created_at: string
}

export interface StatsByChannel { channel: string; count: number }
export interface StatsByHandler { handler_name: string; count: number }
export interface StatsByClosureDuration { duration_range: string; count: number }
export interface StatsByReviewTag { tag: string; count: number }

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  missing_materials: '缺材料',
  under_review: '复核中',
  completed: '已完成',
  closed: '已关闭',
}

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  missing_materials: 'bg-orange-100 text-orange-800',
  under_review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}
