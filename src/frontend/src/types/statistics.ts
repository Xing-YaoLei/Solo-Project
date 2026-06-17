import { DocumentType, DocumentStatus, AmountConsistencyStatus } from './enums'

export interface StatisticsOverview {
  totalProjects: number
  activeProjects: number
  pendingDocuments: number
  pendingApprovals: number
  inconsistentDocuments: number
  totalBudget: number
  totalPaid: number
  totalReceivable: number
}

export interface PaymentCycle {
  period: string
  projectCount: number
  expectedAmount: number
  actualPaid: number
  averagePaymentDays: number
}

export interface DocumentSummary {
  documentId: string
  documentNumber: string
  title: string
  type: DocumentType
  expectedAmount: number
  actualAmount?: number
  status: DocumentStatus
  amountConsistency: AmountConsistencyStatus
  createdAt: string
}

export interface ProjectPerformance {
  projectId: string
  projectName: string
  projectNumber: string
  ownerName: string
  totalBudget: number
  paidAmount: number
  remainingAmount: number
  paymentCount: number
  paymentDelayDays: number
  documents: DocumentSummary[]
}

export interface AmountInconsistency {
  documentId: string
  documentNumber: string
  title: string
  projectName: string
  expectedAmount: number
  actualAmount?: number
  difference: number
  differencePercentage: string
  status: AmountConsistencyStatus
  createdAt: string
  createdBy: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
}
