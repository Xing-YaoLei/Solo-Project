export interface UserInfo {
  id: number;
  fullName: string;
  email: string;
  employeeId?: string;
  department?: string;
  role: number;
  roleName: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export enum AuditRole {
  Auditor = 1,
  BusinessOwner = 2,
  ComplianceOfficer = 3,
  Management = 4
}

export enum CheckStatus {
  Pending = 1,
  InProgress = 2,
  Submitted = 3,
  Reviewed = 4,
  Approved = 5,
  Rejected = 6,
  Closed = 7
}

export enum RiskLevel {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export enum EvidenceStatus {
  Complete = 1,
  Missing = 2,
  SupplementRequested = 3,
  SupplementProvided = 4,
  Waived = 5
}

export enum RectificationStatus {
  NotStarted = 1,
  InProgress = 2,
  SubmittedForReview = 3,
  Verified = 4,
  Closed = 5,
  Overdue = 6
}

export enum ScheduleFrequency {
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
  Quarterly = 4,
  SemiAnnually = 5,
  Annually = 6,
  AdHoc = 7
}

export interface DashboardStats {
  totalSchedules: number;
  myPendingSchedules: number;
  myInProgressSchedules: number;
  pendingReviewCount: number;
  openCheckRecords: number;
  evidenceMissingCount: number;
  overdueRectifications: number;
  overallComplianceRate: number;
  highRiskFindings: number;
  criticalRiskFindings: number;
}

export interface ScheduleSummary {
  status: CheckStatus;
  count: number;
  percentage: number;
}

export interface ScheduleListDto {
  id: number;
  scheduleNo: string;
  title: string;
  regulationId: number;
  regulationName: string;
  auditorId: number;
  auditorName: string;
  businessOwnerId?: number;
  businessOwnerName?: string;
  frequency: number;
  startDate: string;
  endDate: string;
  dueDate: string;
  riskLevel: number;
  status: number;
  createdAt: string;
}

export interface ScheduleDetailDto extends ScheduleListDto {
  description?: string;
  scope?: string;
  remarks?: string;
  checklistItemCount: number;
  samplingRecordCount: number;
  checkRecordCount: number;
  rectificationCount: number;
}

export interface ChecklistItemDto {
  id: number;
  scheduleId: number;
  itemNo: string;
  content: string;
  riskLevel: number;
  evidenceRequirements?: string;
  sortOrder: number;
  status: number;
  isCompliant?: boolean;
  findings?: string;
  auditNotes?: string;
  checkedAt?: string;
  reviewedAt?: string;
  evidenceStatus: number;
  evidenceCount: number;
}

export interface SamplingListDto {
  id: number;
  samplingNo: string;
  sourceSystem: string;
  sourceModule: string;
  documentNo: string;
  documentType: string;
  documentDate: string;
  department?: string;
  businessOwner?: string;
  description?: string;
  riskLevel: number;
  status: number;
  batchNo?: string;
  amount?: number;
  createdAt: string;
  checkRecordCount: number;
}

export interface CheckRecordListDto {
  id: number;
  scheduleId: number;
  checklistItemId?: number;
  checklistItemNo?: string;
  samplingRecordId?: number;
  samplingDocNo?: string;
  status: number;
  isCompliant?: boolean;
  findings?: string;
  riskLevel: number;
  evidenceStatus: number;
  checkedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  sourceReference?: string;
  evidenceCount: number;
}

export interface RectificationListDto {
  id: number;
  rectificationNo: string;
  scheduleId: number;
  scheduleTitle: string;
  checkRecordId?: number;
  title: string;
  ownerId: number;
  ownerName: string;
  deadline: string;
  status: number;
  riskLevel: number;
  createdAt: string;
}

export interface EvidenceMissingListDto {
  id: number;
  missingNo: string;
  checkRecordId: number;
  checklistItemId?: number;
  status: number;
  missingDescription: string;
  requestedById: number;
  responsibleId?: number;
  responsibleName?: string;
  requestedAt: string;
  deadline?: string;
  suppliedAt?: string;
  isWaived?: boolean;
  evidenceCount: number;
}

export interface EvidenceDto {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  description?: string;
  isSupplement: boolean;
  createdAt: string;
}

export interface ProcessingHistoryDto {
  id: number;
  entityType: string;
  entityId: number;
  actionType: string;
  description: string;
  fromStatus?: number;
  toStatus?: number;
  operatorId: number;
  operatorName: string;
  operatorRole: number;
  operatorRoleName: string;
  operatedAt: string;
  batchId?: string;
  sourceReference?: string;
}

export interface ComplianceRateSummary {
  category: string;
  totalChecks: number;
  compliantCount: number;
  complianceRate: number;
}

export interface SamplingCoverageReport {
  scheduleId: number;
  scheduleTitle: string;
  totalDocuments: number;
  sampledCount: number;
  coverageRate: number;
  details: SamplingCoverageDetail[];
}

export interface SamplingCoverageDetail {
  documentType: string;
  totalDocuments: number;
  sampledCount: number;
  coverageRate: number;
  sampledDocumentNos: string[];
}

export interface DocumentTraceInfo {
  entityId: number;
  entityType: string;
  title: string;
  status: string;
  actionTime: string;
  operator: string;
  remarks?: string;
  sourceReference?: string;
}

export interface AuditorPerformance {
  auditorId: number;
  auditorName: string;
  completedSchedules: number;
  totalCheckRecords: number;
  nonCompliantCount: number;
  detectionRate: number;
  averageCompletionDays: number;
}

export interface EvidenceCompletionReport {
  totalCheckRecords: number;
  completeEvidenceCount: number;
  missingEvidenceCount: number;
  supplementRequestedCount: number;
  evidenceCompletionRate: number;
}

export interface Regulation {
  id: number;
  regulationNo: string;
  title: string;
  category: string;
  version?: string;
  effectiveDate: string;
  expiryDate?: string;
  issuingAuthority?: string;
  content?: string;
  fileUrl?: string;
  isActive: boolean;
  tags?: string;
}
