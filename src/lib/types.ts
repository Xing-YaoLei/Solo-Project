export type TicketStatus = "pending_remediation" | "in_remediation" | "pending_review" | "closed"

export type ReviewOpinion = "approved" | "rejected" | "returned_for_modification"

export type ClosureReason = "remediated" | "risk_accepted" | "no_longer_applicable"

export type UserRole = "auditor" | "business_owner" | "compliance_officer" | "management"

export type RemarkPriority = "high" | "medium" | "low"

export type ImportType = "erp_export" | "permission_log"

export type FunnelStageKey = "discovered" | "assigned" | "remediating" | "reviewing" | "closed"

export type BoardGroupBy = "review_opinion" | "closure_reason" | "status"

export type SharePage = "funnel" | "board" | "ticket"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
}

export interface Ticket {
  id: string
  ticketNo: string
  title: string
  description: string
  status: TicketStatus
  department: string
  assigneeId: string
  auditorId: string
  dueDate: string
  closureReason?: ClosureReason
  createdAt: string
  updatedAt: string
  firstResolution: boolean
}

export interface ImportRecord {
  id: string
  type: ImportType
  fileName: string
  fileUrl: string
  totalRows: number
  successRows: number
  errorRows: number
  operatorId: string
  createdAt: string
}

export interface RemediationLog {
  id: string
  ticketId: string
  action: string
  description: string
  operatorId: string
  createdAt: string
}

export interface ReviewRecord {
  id: string
  ticketId: string
  reviewerId: string
  opinion: ReviewOpinion
  comment: string
  createdAt: string
}

export interface EmailMaterial {
  id: string
  ticketId: string
  subject: string
  sender: string
  recipients: string
  sentAt: string
  bodyPreview: string
  attachmentUrls: string
  storagePath: string
  createdAt: string
}

export interface RemarkTask {
  id: string
  ticketId: string
  reviewId: string
  description: string
  priority: RemarkPriority
  dueDate: string
  completed: boolean
  completedBy?: string
  completedAt?: string
  createdAt: string
}

export interface ShareLink {
  id: string
  token: string
  createdBy: string
  page: SharePage
  ticketId?: string
  allowedRoles: UserRole[]
  expiresAt: string
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: Record<string, unknown>
  createdAt: string
}

export interface FunnelStage {
  stage: FunnelStageKey
  count: number
  conversionRate: number
  conclusions: Array<{ summary: string; detail: string }>
}

export interface FunnelData {
  stages: FunnelStage[]
  firstResolutionRate: number
  firstResolutionTrend: Array<{ month: string; rate: number }>
}

export interface BoardChild {
  key: string
  label: string
  count: number
  tickets: Array<{ id: string; ticketNo: string; title: string; status: TicketStatus }>
}

export interface BoardGroup {
  key: string
  label: string
  count: number
  children?: BoardChild[]
}

export interface BoardData {
  groupBy: BoardGroupBy
  groups: BoardGroup[]
}

export interface TicketListResponse {
  tickets: Ticket[]
  total: number
  page: number
  pageSize: number
}

export interface TicketDetailResponse {
  ticket: Ticket
  remediationLog: RemediationLog[]
  reviewRecords: ReviewRecord[]
  emailMaterials: EmailMaterial[]
  remarkTasks: RemarkTask[]
}

export interface ErpImportRequest {
  fileUrl: string
  mapping: Record<string, string>
}

export interface ErpImportResponse {
  importId: string
  totalRows: number
  successRows: number
  errorRows: number
  errors: Array<{ row: number; field: string; message: string }>
}

export interface PermissionLogImportRequest {
  fileUrl: string
  format: "csv" | "json"
}

export interface PermissionLogImportResponse {
  importId: string
  totalRecords: number
  linkedTickets: number
  errors?: Array<{ row: number; ticket_no: string; reason: string }>
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

export interface CreateShareRequest {
  scope: UserRole[]
  expiresIn: number
  page: SharePage
  ticketId?: string
}

export interface CreateShareResponse {
  shareToken: string
  shareUrl: string
  expiresAt: string
}

export interface ShareAccessResponse {
  allowed: boolean
  role: string
  data: FunnelData | BoardData | TicketDetailResponse
  masked: boolean
}

export interface ReviewRequest {
  opinion: ReviewOpinion
  comment: string
}

export interface ReviewResponse {
  review: ReviewRecord
  remarkTask?: RemarkTask
}

export interface MeResponse {
  user: AuthUser
}
