export enum QuoteStatus {
  Draft = 'Draft',
  PendingReview = 'PendingReview',
  NeedMoreInfo = 'NeedMoreInfo',
  Escalated = 'Escalated',
  Approved = 'Approved',
  Processing = 'Processing',
  AmountException = 'AmountException',
  Completed = 'Completed',
  Closed = 'Closed',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Partial = 'Partial',
  Paid = 'Paid',
  Overdue = 'Overdue',
  Cancelled = 'Cancelled',
}

export enum ReconciliationStatus {
  Pending = 'Pending',
  Matched = 'Matched',
  Mismatched = 'Mismatched',
  Resolved = 'Resolved',
}

export enum Channel {
  Online = 'Online',
  Offline = 'Offline',
  Partner = 'Partner',
  Referral = 'Referral',
}

export enum PaymentMethod {
  BankTransfer = 'BankTransfer',
  Alipay = 'Alipay',
  WeChatPay = 'WeChatPay',
  Cash = 'Cash',
  Check = 'Check',
  Other = 'Other',
}

export enum AmountCheckType {
  QuoteItemsVsQuoteAmount = 'QuoteItemsVsQuoteAmount',
  PaymentsVsReconciliation = 'PaymentsVsReconciliation',
  Other = 'Other',
}

export interface QuoteItem {
  id: string
  quoteId: string
  itemName: string
  description?: string
  unitPrice: number
  quantity: number
  subtotal: number
  createdAt: string
}

export interface Quote {
  id: string
  quoteNo: string
  caseName: string
  clientName: string
  channel: Channel
  amount: number
  discountAmount: number
  finalAmount: number
  status: QuoteStatus
  createdAt: string
  createdBy: string
  approvedAt?: string
  approvedBy?: string
  completedAt?: string
  closedAt?: string
  remarks?: string
  expectedPaymentDate?: string
  owner?: string
  items: QuoteItem[]
  payments: PaymentRecord[]
  reconciliations: ReconciliationRecord[]
  statusHistories: StatusHistory[]
  amountChecks: AmountCheckResult[]
}

export interface PaymentRecord {
  id: string
  quoteId: string
  paymentNo: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  status: PaymentStatus
  bankTransactionNo?: string
  payer?: string
  remarks?: string
  createdAt: string
  createdBy: string
}

export interface ReconciliationRecord {
  id: string
  quoteId: string
  reconcileDate: string
  expectedAmount: number
  actualAmount: number
  difference: number
  status: ReconciliationStatus
  resolvedBy?: string
  resolvedAt?: string
  remarks?: string
  createdAt: string
}

export interface StatusHistory {
  id: string
  quoteId: string
  fromStatus: QuoteStatus
  toStatus: QuoteStatus
  changedBy?: string
  changedAt: string
  remarks?: string
}

export interface AmountCheckResult {
  id: string
  quoteId: string
  checkType: AmountCheckType
  expectedAmount: number
  actualAmount: number
  difference: number
  isMatch: boolean
  checkedAt: string
  checkedBy?: string
  remarks?: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface QuoteFilter {
  status?: QuoteStatus
  channel?: Channel
  owner?: string
  startDate?: string
  endDate?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface CreateQuoteDto {
  caseName: string
  clientName: string
  channel: Channel
  amount: number
  discountAmount?: number
  finalAmount: number
  remarks?: string
  expectedPaymentDate?: string
  owner?: string
  items?: CreateQuoteItemDto[]
}

export interface CreateQuoteItemDto {
  itemName: string
  description?: string
  unitPrice: number
  quantity: number
}

export interface UpdateQuoteDto {
  caseName?: string
  clientName?: string
  channel?: Channel
  amount?: number
  discountAmount?: number
  finalAmount?: number
  remarks?: string
  expectedPaymentDate?: string
  owner?: string
}

export interface CreatePaymentDto {
  quoteId: string
  amount: number
  paymentDate: string
  paymentMethod: PaymentMethod
  bankTransactionNo?: string
  payer?: string
  remarks?: string
}

export interface CreateReconciliationDto {
  quoteId: string
  reconcileDate: string
  expectedAmount: number
  actualAmount: number
  remarks?: string
}

export interface ResolveReconciliationDto {
  remarks: string
}

export interface WorkflowReasonDto {
  reason?: string
}

export interface DashboardSummaryDto {
  pendingCount: number
  exceptionCount: number
  monthlyCollectedAmount: number
  reconciliationDifferenceCount: number
  totalQuoteCount: number
  completedQuoteCount: number
  totalAmount: number
  overdueCount: number
}

export interface PeriodSummaryDto {
  period: string
  startDate: string
  endDate: string
  totalQuotes: number
  totalAmount: number
  totalPaid: number
  completedCount: number
  exceptionCount: number
  statusBreakdown: { status: QuoteStatus; count: number; amount: number }[]
}

export interface ChannelStatisticsDto {
  channel: Channel
  quoteCount: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  collectionRate: number
}

export interface OwnerStatisticsDto {
  owner: string
  quoteCount: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  overdueCount: number
}

export interface StatusChangeSummaryDto {
  periodDays: number
  totalChanges: number
  transitions: { fromStatus: QuoteStatus; toStatus: QuoteStatus; count: number }[]
  byDate: { date: string; count: number }[]
}

export interface PaymentCollectionItemDto {
  quoteId: string
  quoteNo: string
  expectedDate?: string
  firstPaymentDate?: string
  lastPaymentDate?: string
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  collectionDays?: number
  fullyPaid: boolean
}

export interface PaymentCollectionDto {
  totalQuotes: number
  fullyPaidCount: number
  partiallyPaidCount: number
  notPaidCount: number
  averageCollectionDays: number
  details: PaymentCollectionItemDto[]
}
