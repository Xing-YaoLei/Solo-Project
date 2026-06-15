export type Role = 'admin' | 'dean' | 'advisor' | 'student'

export interface RoleScope {
  role: Role
  department?: string
  advisorId?: string
  studentId?: string
}

export interface ShareModalState {
  isOpen: boolean
  activeTab: 'share' | 'export'
  shareRole: Role
  expiryMinutes: number
  generatedLink: string
  exportFormat: 'pdf' | 'xlsx'
  includeUtilizationNote: boolean
}

export interface TrendDataPoint {
  semester: string
  count: number
  riskScore: number
}

export interface GradeComposition {
  grade: string
  count: number
  percentage: number
  fill: string
}

export interface MaterialDetail {
  id: string
  studentName: string
  studentId: string
  materialType: string
  submittedAt: string
  status: '待审核' | '审核中' | '已通过' | '已退回'
  riskLevel: 'low' | 'medium' | 'high'
}

export interface CampusCardRecord {
  id: string
  studentId: string
  studentName: string
  location: string
  timestamp: string
  isAnomaly: boolean
}

export interface AdvisorAnomaly {
  advisorId: string
  advisorName: string
  department: string
  totalReviews: number
  anomalyCount: number
  anomalyRate: number
  recentAnomalies: string[]
}

export interface ShareTokenPayload {
  token: string
  role: Role
  expiresAt: string
  resourceId: string
}

export interface RefreshResponse {
  lastRefreshedAt: string
  dataUpdatedAt: string
}

export interface ExportPayload {
  format: 'pdf' | 'xlsx' | 'csv'
  dateRange: { start: string; end: string }
  filters: Record<string, string>
}
