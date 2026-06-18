export interface UserSummary {
  id: string
  username: string
  role: 'specialist' | 'manager' | 'finance'
}

export interface TransferRecord {
  id: string
  status: 'pending' | 'review' | 'completed' | 'exception'
  contract_no: string
  buyer_name: string
  buyer_id_no: string
  seller_name: string
  seller_id_no: string
  transfer_tax: number
  created_at: string
  updated_at: string
  assignee: UserSummary
  reviewer: UserSummary | null
  reviewed_at: string | null
  review_note: string | null
  exception_items: ExceptionItem[]
  exception_count: number
  review_tags: string[]
}

export interface TransferRecordCreate {
  contract_no: string
  buyer_name: string
  buyer_id_no: string
  seller_name: string
  seller_id_no: string
  transfer_tax: number
  assignee?: number | string | null
}

export interface TransferRecordUpdate {
  contract_no?: string
  buyer_name?: string
  buyer_id_no?: string
  seller_name?: string
  seller_id_no?: string
  transfer_tax?: number
  status?: 'pending' | 'review' | 'completed'
  review_note?: string
}

export interface Quotation {
  id: string
  record_id: string
  price: number
  quoted_at: string
  quoted_by: UserSummary
  note: string
}

export interface QuotationCreate {
  record_id: string
  price: number
  note: string
}

export interface FileAttachment {
  id: string
  file_name: string
  file_url: string
  file_size: number
  uploaded_at: string
}

export interface FinanceDoc {
  id: string
  record_id: string
  loan_scheme: string
  down_payment_ratio: number
  monthly_payment: number
  months: number
  institution: string
  attachments: FileAttachment[]
}

export interface VehicleProfile {
  id: string
  record_id: string
  brand: string
  model: string
  vin: string
  mileage: number
  condition_grade: 'A' | 'B' | 'C' | 'D'
  registration_date: string
  source_channel: string
  license_images: FileAttachment[]
  registration_images: FileAttachment[]
}

export type MissingType = 'buyer_id' | 'seller_id' | 'license' | 'registration' | 'contract' | 'finance' | 'other'
export type UrgencyLevel = 'low' | 'medium' | 'high'
export type ExceptionStatus = 'open' | 'reminded' | 'escalated' | 'resolved' | 'closed'

export interface ExceptionItemRecordSummary {
  id: string
  contract_no: string
  status: string
}

export interface ExceptionItem {
  id: string
  record: ExceptionItemRecordSummary
  record_id: string
  missing_type: MissingType
  urgency: UrgencyLevel
  status: ExceptionStatus
  discovered_at: string
  resolved_at: string | null
  notes: ExceptionNote[]
}

export interface ExceptionNote {
  id: string
  author: UserSummary
  content: string
  created_at: string
}

export interface AnalyticsOverview {
  turnover_avg_days: number
  turnover_trend: { month: string; avg_days: number }[]
  channel_stats: { channel: string; count: number; avg_days: number }[]
  assignee_stats: { assignee: UserSummary; count: number; avg_hours: number; exception_rate: number }[]
  tag_cloud: { tag: string; count: number }[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
