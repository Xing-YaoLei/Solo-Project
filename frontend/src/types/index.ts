export type UserRole = 'lawyer' | 'assistant' | 'partner' | 'client'

export interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type QuoteStatus =
  | 'draft'
  | 'pending_review'
  | 'approving'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'confirmed'
  | 'in_payment'
  | 'partially_paid'
  | 'paid'
  | 'closed'
  | 'exception'

export type FeeType =
  | 'consulting'
  | 'litigation'
  | 'non_litigation'
  | 'retainer'
  | 'travel'
  | 'document'
  | 'notary'
  | 'other'

export interface InvoiceItem {
  id: string
  quote_id: string
  item_name: string
  fee_type: FeeType
  description?: string
  quantity: number
  unit_price: number
  discount_rate: number
  amount: number
  actual_amount: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  quote_no: string
  title: string
  client_name: string
  client_contact?: string
  client_phone?: string
  case_description?: string
  case_type?: string
  total_amount: number
  discounted_amount: number
  paid_amount: number
  currency: string
  status: QuoteStatus
  priority: string
  assigned_to?: string
  expected_payment_date?: string
  actual_payment_date?: string
  payment_deadline?: string
  remarks?: string
  creator_name?: string
  assignee_name?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface QuoteDetail extends Quote {
  invoice_items: InvoiceItem[]
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped'

export interface ApprovalNode {
  id: string
  quote_id: string
  approver_id: string
  approver_name?: string
  node_order: number
  node_name: string
  required_role?: string
  status: ApprovalStatus
  comment?: string
  approved_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PaymentMethod = 'bank_transfer' | 'alipay' | 'wechat' | 'cash' | 'check' | 'other'
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded'

export interface Payment {
  id: string
  quote_id: string
  quote_title?: string
  client_name?: string
  payment_no: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  payment_date?: string
  transaction_id?: string
  bank_name?: string
  bank_account?: string
  payer_name?: string
  operator_id?: string
  operator_name?: string
  remarks?: string
  confirmed_at?: string
  created_at: string
  updated_at: string
}

export type ExceptionType =
  | 'amount_mismatch'
  | 'approval_abnormal'
  | 'payment_delay'
  | 'document_missing'
  | 'client_dispute'
  | 'other'

export type ExceptionStatus = 'open' | 'investigating' | 'resolving' | 'resolved' | 'closed'

export interface ExceptionRecord {
  id: string
  quote_id: string
  quote_title?: string
  client_name?: string
  title: string
  exception_type: ExceptionType
  status: ExceptionStatus
  description: string
  source_ref?: string
  expected_amount?: number
  actual_amount?: number
  difference_amount?: number
  handled_by?: string
  handler_name?: string
  resolution?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface ExceptionHistory {
  id: string
  exception_id: string
  action: string
  from_status?: string
  to_status?: string
  comment?: string
  operator_id?: string
  operator_name?: string
  source_record?: string
  created_at: string
  updated_at: string
}

export type AttachmentCategory =
  | 'contract'
  | 'invoice'
  | 'receipt'
  | 'poa'
  | 'court_document'
  | 'evidence'
  | 'other'

export interface Attachment {
  id: string
  quote_id?: string
  exception_id?: string
  payment_id?: string
  file_name: string
  file_path: string
  file_size: number
  content_type?: string
  category: AttachmentCategory
  description?: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}
