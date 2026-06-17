export interface WeatherForecast {
  date: string
  temperatureC: number
  temperatureF: number
  summary: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
  code: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

export interface PagedQuery {
  pageIndex?: number
  pageSize?: number
  sortField?: string
  sortOrder?: string
}

export const SiteStatus = {
  Pending: 0,
  InProgress: 1,
  ToBeConfirmed: 2,
  Confirmed: 3,
  Completed: 4,
  Closed: 5
} as const

export type SiteStatus = typeof SiteStatus[keyof typeof SiteStatus]

export const SiteStatusText: Record<SiteStatus, string> = {
  [SiteStatus.Pending]: '待开工',
  [SiteStatus.InProgress]: '进行中',
  [SiteStatus.ToBeConfirmed]: '待确认',
  [SiteStatus.Confirmed]: '已确认',
  [SiteStatus.Completed]: '已完成',
  [SiteStatus.Closed]: '已关闭'
}

export const MaterialCategory = {
  Basic: 0,
  Contract: 1,
  Payment: 2,
  Acceptance: 3,
  Other: 4
} as const

export type MaterialCategory = typeof MaterialCategory[keyof typeof MaterialCategory]

export const MaterialCategoryText: Record<MaterialCategory, string> = {
  [MaterialCategory.Basic]: '基础资料',
  [MaterialCategory.Contract]: '合同资料',
  [MaterialCategory.Payment]: '付款资料',
  [MaterialCategory.Acceptance]: '验收资料',
  [MaterialCategory.Other]: '其他资料'
}

export const SubmissionStatus = {
  Pending: 0,
  Submitted: 1,
  Approved: 2,
  Rejected: 3,
  Closed: 4
} as const

export type SubmissionStatus = typeof SubmissionStatus[keyof typeof SubmissionStatus]

export const SubmissionStatusText: Record<SubmissionStatus, string> = {
  [SubmissionStatus.Pending]: '未提交',
  [SubmissionStatus.Submitted]: '已提交',
  [SubmissionStatus.Approved]: '已通过',
  [SubmissionStatus.Rejected]: '已驳回',
  [SubmissionStatus.Closed]: '已关闭'
}

export const ChangeType = {
  Status: 0,
  Schedule: 1,
  Material: 2,
  Info: 3,
  Other: 4
} as const

export type ChangeType = typeof ChangeType[keyof typeof ChangeType]

export const ChangeTypeText: Record<ChangeType, string> = {
  [ChangeType.Status]: '状态变更',
  [ChangeType.Schedule]: '排程变更',
  [ChangeType.Material]: '材料变更',
  [ChangeType.Info]: '信息变更',
  [ChangeType.Other]: '其他变更'
}

export const NotificationType = {
  System: 0,
  Material: 1,
  Schedule: 2,
  Approval: 3,
  Warning: 4
} as const

export type NotificationType = typeof NotificationType[keyof typeof NotificationType]

export const NotificationTypeText: Record<NotificationType, string> = {
  [NotificationType.System]: '系统通知',
  [NotificationType.Material]: '材料通知',
  [NotificationType.Schedule]: '排程通知',
  [NotificationType.Approval]: '审批通知',
  [NotificationType.Warning]: '预警通知'
}

export const ActionType = {
  Create: 0,
  Update: 1,
  Delete: 2,
  Submit: 3,
  Approve: 4,
  Reject: 5,
  Confirm: 6,
  Close: 7,
  Other: 8
} as const

export type ActionType = typeof ActionType[keyof typeof ActionType]

export const ActionTypeText: Record<ActionType, string> = {
  [ActionType.Create]: '创建',
  [ActionType.Update]: '更新',
  [ActionType.Delete]: '删除',
  [ActionType.Submit]: '提交',
  [ActionType.Approve]: '通过',
  [ActionType.Reject]: '驳回',
  [ActionType.Confirm]: '确认',
  [ActionType.Close]: '关闭',
  [ActionType.Other]: '其他'
}

export interface Area {
  id: number
  name: string
  description?: string
}

export interface PersonInCharge {
  id: number
  name: string
  phone: string
  email?: string
  role?: string
}

export interface ConstructionSite {
  id: number
  siteName: string
  address: string
  customerId: number
  customerName: string
  customerPhone: string
  areaId: number
  areaName: string
  personInChargeId: number
  personInChargeName: string
  personInChargePhone: string
  status: SiteStatus
  statusText: string
  tagGroup?: string
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  confirmationDeadline?: string
  budget?: number
  remark?: string
  materialCompleteRate: number
  totalMaterialCount: number
  submittedMaterialCount: number
  createdAt: string
  updatedAt: string
}

export interface ConstructionSiteQuery extends PagedQuery {
  siteName?: string
  status?: SiteStatus
  areaId?: number
  personInChargeId?: number
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  tagGroup?: string
  customerName?: string
}

export interface ConstructionSiteCreate {
  siteName: string
  address: string
  customerId: number
  areaId: number
  personInChargeId: number
  status?: SiteStatus
  tagGroup?: string
  plannedStartDate?: string
  plannedEndDate?: string
  confirmationDeadline?: string
  budget?: number
  remark?: string
}

export interface ConstructionSiteUpdate {
  id: number
  siteName: string
  address: string
  customerId: number
  areaId: number
  personInChargeId: number
  status: SiteStatus
  tagGroup?: string
  plannedStartDate?: string
  plannedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  confirmationDeadline?: string
  budget?: number
  remark?: string
}

export interface ConstructionSiteStatusUpdate {
  id: number
  status: SiteStatus
  remark?: string
}

export interface CustomerProfile {
  id: number
  customerName: string
  phone: string
  email?: string
  address?: string
  idCard?: string
  remark?: string
  createdAt: string
  updatedAt: string
  siteCount: number
}

export interface CustomerProfileQuery extends PagedQuery {
  customerName?: string
  phone?: string
}

export interface CustomerProfileCreate {
  customerName: string
  phone: string
  email?: string
  address?: string
  idCard?: string
  remark?: string
}

export interface CustomerProfileUpdate {
  id: number
  customerName: string
  phone: string
  email?: string
  address?: string
  idCard?: string
  remark?: string
}

export interface AttachmentMaterial {
  id: number
  name: string
  description?: string
  category: MaterialCategory
  categoryText: string
  isRequired: boolean
  sortOrder: number
  fileExtensions?: string
  maxFileSize?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface AttachmentMaterialQuery extends PagedQuery {
  name?: string
  category?: MaterialCategory
  isRequired?: boolean
  isActive?: boolean
}

export interface AttachmentMaterialCreate {
  name: string
  description?: string
  category: MaterialCategory
  isRequired: boolean
  sortOrder: number
  fileExtensions?: string
  maxFileSize?: number
  isActive?: boolean
}

export interface AttachmentMaterialUpdate {
  id: number
  name: string
  description?: string
  category: MaterialCategory
  isRequired: boolean
  sortOrder: number
  fileExtensions?: string
  maxFileSize?: number
  isActive: boolean
}

export interface TagGroupRule {
  id: number
  name: string
  description?: string
  rules?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TagGroupRuleQuery extends PagedQuery {
  name?: string
  isActive?: boolean
}

export interface TagGroupRuleCreate {
  name: string
  description?: string
  rules?: string
  sortOrder: number
  isActive?: boolean
}

export interface TagGroupRuleUpdate {
  id: number
  name: string
  description?: string
  rules?: string
  sortOrder: number
  isActive: boolean
}

export interface AuthScopeThreshold {
  id: number
  scopeName: string
  scopeCode: string
  minValue?: number
  maxValue?: number
  unit?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthScopeThresholdQuery extends PagedQuery {
  scopeName?: string
  scopeCode?: string
  isActive?: boolean
}

export interface AuthScopeThresholdCreate {
  scopeName: string
  scopeCode: string
  minValue?: number
  maxValue?: number
  unit?: string
  description?: string
  isActive?: boolean
}

export interface AuthScopeThresholdUpdate {
  id: number
  scopeName: string
  scopeCode: string
  minValue?: number
  maxValue?: number
  unit?: string
  description?: string
  isActive: boolean
}

export interface TimelineChange {
  id: number
  siteId: number
  siteName: string
  changeType: ChangeType
  changeTypeText: string
  changeTitle: string
  changeDescription?: string
  oldValue?: string
  newValue?: string
  oldDate?: string
  newDate?: string
  operatorName?: string
  operatorRole?: string
  changeTime: string
  remark?: string
}

export interface TimelineChangeQuery extends PagedQuery {
  siteId?: number
  changeType?: ChangeType
  changeTimeFrom?: string
  changeTimeTo?: string
  operatorName?: string
}

export interface TimelineChangeCreate {
  siteId: number
  changeType: ChangeType
  changeTitle: string
  changeDescription?: string
  oldValue?: string
  newValue?: string
  oldDate?: string
  newDate?: string
  operatorName?: string
  operatorRole?: string
  remark?: string
}

export interface MaterialSubmission {
  id: number
  siteId: number
  siteName: string
  confirmationId?: number
  materialId: number
  materialName: string
  materialCategory: MaterialCategory
  materialCategoryText: string
  isRequired: boolean
  status: SubmissionStatus
  statusText: string
  filePath?: string
  fileName?: string
  fileSize?: number
  remark?: string
  submittedAt?: string
  submittedBy?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewComment?: string
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface MaterialSubmissionQuery extends PagedQuery {
  siteId?: number
  materialId?: number
  status?: SubmissionStatus
  category?: MaterialCategory
  submittedFrom?: string
  submittedTo?: string
}

export interface MaterialSubmissionCreate {
  siteId: number
  confirmationId?: number
  materialId: number
  filePath?: string
  fileName?: string
  fileSize?: number
  remark?: string
  submittedBy?: string
}

export interface MaterialSubmissionUpdate {
  id: number
  status: SubmissionStatus
  filePath?: string
  fileName?: string
  fileSize?: number
  remark?: string
}

export interface MaterialSubmissionReview {
  id: number
  status: SubmissionStatus
  reviewComment?: string
  reviewedBy?: string
}

export interface MaterialSubmissionRetry {
  id: number
  filePath?: string
  fileName?: string
  fileSize?: number
  remark?: string
  operatorName?: string
}

export interface MaterialSubmissionClose {
  id: number
  remark?: string
  operatorName?: string
}

export interface ScheduleConfirmation {
  id: number
  siteId: number
  siteName: string
  confirmType: string
  confirmStatus: string
  confirmedBy?: string
  confirmedAt?: string
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationRecord {
  id: number
  siteId?: number
  siteName?: string
  type: NotificationType
  typeText: string
  title: string
  content?: string
  isRead: boolean
  createdAt: string
  readAt?: string
  receiver?: string
}

export interface NotificationQuery extends PagedQuery {
  type?: NotificationType
  isRead?: boolean
  siteId?: number
  receiver?: string
}

export interface ActionLog {
  id: number
  siteId?: number
  siteName?: string
  actionType: ActionType
  actionTypeText: string
  actionTitle: string
  actionDetail?: string
  operatorName?: string
  operatorRole?: string
  actionTime: string
  ipAddress?: string
  userAgent?: string
}

export interface ActionLogQuery extends PagedQuery {
  siteId?: number
  actionType?: ActionType
  actionTimeFrom?: string
  actionTimeTo?: string
  operatorName?: string
}

export interface StatisticsOverview {
  totalSites: number
  pendingSites: number
  inProgressSites: number
  toBeConfirmedSites: number
  confirmedSites: number
  completedSites: number
  totalMaterials: number
  submittedMaterials: number
  approvedMaterials: number
  missingMaterials: number
  overallCompleteRate: number
  overallApprovedRate: number
  pendingNotifications: number
  todayNotifications: number
}

export interface MaterialCompleteRate {
  siteId: number
  siteName: string
  areaName: string
  personInChargeName: string
  totalRequiredCount: number
  submittedCount: number
  approvedCount: number
  missingCount: number
  completeRate: number
  approvedRate: number
}

export interface AreaStatistics {
  areaId: number
  areaName: string
  siteCount: number
  avgCompleteRate: number
  missingMaterialCount: number
}

export interface PersonStatistics {
  personId: number
  personName: string
  siteCount: number
  avgCompleteRate: number
  missingMaterialCount: number
}

export interface MaterialStatistics {
  materialId: number
  materialName: string
  category: string
  totalSites: number
  submittedCount: number
  approvedCount: number
  submissionRate: number
  approvalRate: number
}

export interface ReviewQuery {
  startDate?: string
  endDate?: string
  areaId?: number
  personInChargeId?: number
  tagGroup?: string
}

export interface TodoItem {
  id: number
  title: string
  description: string
  type: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'done'
  deadline?: string
  siteId?: number
  siteName?: string
}
