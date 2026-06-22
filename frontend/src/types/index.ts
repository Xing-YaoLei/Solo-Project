import {
  UserRole,
  SamplingStatus,
  EvidenceStatus,
  RiskLevel,
  RectificationStatus,
  MaterialStatus,
  ExceptionType,
  ExceptionStatus,
  ExportType,
} from './enums'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  createdAt: string
  token?: string
}

export interface Vendor {
  id: number
  name: string
  contact?: string
  email?: string
  phone?: string
  address?: string
  createdAt: string
}

export interface AuditChecklist {
  id: number
  title: string
  category: string
  description?: string
  criteria: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface AuditChecklistFormData {
  title: string
  category: string
  description?: string
  criteria: string
}

export interface SamplingRecord {
  id: number
  checklistId: number
  sampleName: string
  sampleCode: string
  source?: string
  samplingDate: string
  sampledBy?: string
  status: SamplingStatus
  sampleData?: Record<string, any>
  evidenceStatus: EvidenceStatus
  createdAt: string
}

export interface SamplingRecordFormData {
  checklistId: number
  sampleName: string
  sampleCode: string
  source?: string
  samplingDate: string
  sampledBy?: string
  sampleData?: Record<string, any>
  evidenceStatus: EvidenceStatus
}

export interface SamplingStatusUpdateData {
  status: SamplingStatus
  remark?: string
}

export interface RectificationPlan {
  id: number
  samplingId: number
  title: string
  description?: string
  riskLevel: RiskLevel
  deadline?: string
  responsiblePerson?: string
  vendorId?: number
  status: RectificationStatus
  createdAt: string
  updatedAt: string
}

export interface RectificationPlanFormData {
  samplingId: number
  title: string
  description?: string
  riskLevel: RiskLevel
  deadline?: string
  responsiblePerson?: string
  vendorId?: number
}

export interface RectificationStatusUpdateData {
  status: RectificationStatus
  remark?: string
}

export interface SupplierMaterial {
  id: number
  vendorId: number
  materialType: string
  materialName: string
  uploadDate: string
  uploadedBy?: string
  filePath: string
  status: MaterialStatus
}

export interface ExceptionOrder {
  id: number
  samplingId: number
  exceptionType: ExceptionType
  impactScope?: string
  responsiblePerson?: string
  rootCause?: string
  handlingResult?: string
  status: ExceptionStatus
  createdAt: string
  updatedAt: string
}

export interface ExceptionOrderFormData {
  samplingId: number
  exceptionType?: ExceptionType
  impactScope?: string
  responsiblePerson?: string
  rootCause?: string
  handlingResult?: string
  status?: ExceptionStatus
}

export interface ExceptionStatusUpdateData {
  status: ExceptionStatus
  remark?: string
}

export interface StatusChangeLog {
  id: number
  entityType: string
  entityId: number
  oldStatus?: string
  newStatus: string
  changedBy: number
  changedAt: string
  remark?: string
}

export interface SamplingCoverage {
  totalChecklists: number
  sampledChecklists: number
  coverageRate: number
  byCategory: Record<string, { total: number; sampled: number; coverageRate: number }>
  description: string
}

export interface DashboardStats {
  totalChecklists: number
  totalSamplings: number
  totalRectifications: number
  totalExceptions: number
  pendingExceptions: number
  totalVendors: number
  samplingCoverageRate: number
  rectificationCompletionRate: number
  riskDistribution: Record<string, number>
  samplingCoverageDescription: string
}

export interface ExportRequest {
  entityType: ExportType | string
  format: 'excel' | 'csv'
  filters?: Record<string, any>
}

export interface ExportTask {
  taskId: string
  status: string
  entityType: string
  format: string
}

export interface LoginData {
  username: string
  password: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  user: User
}

export interface ListResponse<T> {
  total: number
  items: T[]
}

export interface PaginationParams {
  skip?: number
  limit?: number
  keyword?: string
  status?: string
}
