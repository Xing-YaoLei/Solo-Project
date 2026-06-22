export enum QuoteStatus {
  Draft = 'Draft',
  PendingReview = 'PendingReview',
  NeedMoreInfo = 'NeedMoreInfo',
  Escalated = 'Escalated',
  Approved = 'Approved',
  Processing = 'Processing',
  AmountException = 'AmountException',
  Reconciled = 'Reconciled',
  Reviewed = 'Reviewed',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Closed = 'Closed',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Partial = 'Partial',
  Overdue = 'Overdue',
}

export enum ReconciliationStatus {
  Pending = 'Pending',
  Matched = 'Matched',
  Mismatched = 'Mismatched',
  Resolved = 'Resolved',
}

export enum Channel {
  Direct = 'Direct',
  Referral = 'Referral',
  Online = 'Online',
  Corporate = 'Corporate',
}

export enum PaymentMethod {
  BankTransfer = 'BankTransfer',
  Alipay = 'Alipay',
  WeChatPay = 'WeChatPay',
  Cash = 'Cash',
  Check = 'Check',
}

export enum AmountCheckType {
  QuoteItemsVsTotal = 'QuoteItemsVsTotal',
  PaymentsVsReconciliation = 'PaymentsVsReconciliation',
  Custom = 'Custom',
}

export enum AmountCheckStatus {
  Matched = 'Matched',
  Mismatched = 'Mismatched',
}

export interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  remark?: string
}

export interface Quote {
  id: string
  quoteNo: string
  clientName: string
  caseName: string
  channel: Channel
  totalAmount: number
  discountAmount?: number
  finalAmount?: number
  expectedPaymentDate?: string
  owner?: string
  status: QuoteStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  items: QuoteItem[]
  remark?: string
}

export interface PaymentRecord {
  id: string
  quoteId: string
  quoteNo: string
  paymentNo?: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  payer: string
  referenceNo?: string
  bankReferenceNo?: string
  remark?: string
  createdAt: string
}

export interface ReconciliationRecord {
  id: string
  quoteId: string
  quoteNo: string
  expectedAmount: number
  actualAmount: number
  difference: number
  status: ReconciliationStatus
  reconciledBy: string
  reconciledAt: string
  remark?: string
}

export interface StatusHistory {
  id: string
  quoteId: string
  fromStatus: QuoteStatus
  toStatus: QuoteStatus
  operator: string
  operatedAt: string
  remark?: string
}

export interface AmountCheckResult {
  quoteId: string
  quoteNo: string
  expectedAmount: number
  totalPaid: number
  difference: number
  isBalanced: boolean
  paymentRecords: PaymentRecord[]
}

export interface AmountCheckRecord {
  id: string
  quoteId: string
  checkType: AmountCheckType
  expectedAmount: number
  actualAmount: number
  difference: number
  status: AmountCheckStatus
  checkedAt: string
  remark?: string
}

export interface QuoteListFilter {
  status?: QuoteStatus
  statuses?: QuoteStatus[]
  channel?: Channel
  owner?: string
  keyword?: string
  startDate?: string
  endDate?: string
  pageIndex: number
  pageSize: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
}

export interface CreateQuoteRequest {
  clientName: string
  caseName: string
  channel: Channel
  discountAmount?: number
  finalAmount?: number
  expectedPaymentDate?: string
  owner?: string
  items: QuoteItem[]
  remark?: string
}

export interface UpdateQuoteRequest {
  clientName?: string
  caseName?: string
  channel?: Channel
  discountAmount?: number
  finalAmount?: number
  expectedPaymentDate?: string
  owner?: string
  items?: QuoteItem[]
  remark?: string
}

export interface CreatePaymentRequest {
  quoteId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  payer: string
  referenceNo?: string
  bankReferenceNo?: string
  remark?: string
}

export interface WorkflowActionRequest {
  quoteId: string
  remark?: string
}

export interface StatisticsSummary {
  totalQuotes: number
  totalAmount: number
  totalPaid: number
  pendingAmount: number
  reconciledCount: number
  unreconciledCount: number
}

export interface ChannelStatistics {
  channel: Channel
  quoteCount: number
  totalAmount: number
}

export interface OwnerStatistics {
  owner: string
  quoteCount: number
  totalAmount: number
  totalPaid: number
}

export interface PeriodSummaryDto {
  period: string
  quoteCount: number
  totalAmount: number
  totalPaid: number
  pendingAmount: number
}

export interface StatusChangeSummaryDto {
  status: QuoteStatus
  count: number
  totalAmount: number
}

export interface PaymentCollectionDto {
  averageCollectionDays: number
  overdueCount: number
  overdueRate: number
  onTimeCount: number
  onTimeRate: number
}

export interface CreateReconciliationRequest {
  expectedAmount?: number
  actualAmount?: number
  remark?: string
}

export interface ResolveReconciliationRequest {
  remark: string
}
