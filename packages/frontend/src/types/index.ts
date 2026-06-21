// ==================== 通用枚举 ====================
export enum UserRole {
  ADMIN = 'ADMIN',
  LAWYER = 'LAWYER',
  PARALEGAL = 'PARALEGAL',
  CLERK = 'CLERK',
  CLIENT = 'CLIENT',
}

export enum HearingStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

export enum AttendanceStatus {
  NOT_ARRIVED = 'NOT_ARRIVED',
  ARRIVED = 'ARRIVED',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
  LEAVE_EARLY = 'LEAVE_EARLY',
}

export enum ConflictType {
  LAWYER_TIME = 'LAWYER_TIME',
  COURT_ROOM = 'COURT_ROOM',
  CLIENT_CONFLICT = 'CLIENT_CONFLICT',
  JUDGE_TIME = 'JUDGE_TIME',
  CASE_CONFLICT = 'CASE_CONFLICT',
  OTHER = 'OTHER',
}

export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RescheduleReason {
  PARTY_REQUEST = 'PARTY_REQUEST',
  COURT_CHANGE = 'COURT_CHANGE',
  LAWYER_CONFLICT = 'LAWYER_CONFLICT',
  EMERGENCY = 'EMERGENCY',
  JUDGE_UNAVAILABLE = 'JUDGE_UNAVAILABLE',
  OTHER = 'OTHER',
}

export enum ExceptionStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum ExceptionType {
  CONFLICT_OF_INTEREST = 'CONFLICT_OF_INTEREST',
  PROCEDURAL_ERROR = 'PROCEDURAL_ERROR',
  MISSED_DEADLINE = 'MISSED_DEADLINE',
  ATTENDANCE_ISSUE = 'ATTENDANCE_ISSUE',
  COMMUNICATION_ERROR = 'COMMUNICATION_ERROR',
  OTHER = 'OTHER',
}

export enum ReminderType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  APP = 'APP',
  WECHAT = 'WECHAT',
  PHONE = 'PHONE',
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
  CONFIRMED = 'CONFIRMED',
}

export enum CaseStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
}

// ==================== 通用类型 ====================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// ==================== 用户 ====================
export interface User {
  id: string;
  username: string;
  email: string;
  realName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  title?: string;
  barNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== 客户 ====================
export interface Client {
  id: string;
  clientNo: string;
  name: string;
  clientType: string;
  idCardNo?: string;
  taxNo?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  industry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 案件 ====================
export interface Case {
  id: string;
  caseNo: string;
  courtCaseNo?: string;
  title: string;
  caseType: string;
  caseCategory?: string;
  status: CaseStatus;
  courtLevel?: string;
  jurisdiction?: string;
  acceptanceDate?: string;
  deadlineDate?: string;
  description?: string;
  lawInvolved?: string;
  amountInvolved?: string;
  retentionFee?: string;
  paymentStatus?: string;
  lawyerInChargeId?: string;
  assistantInChargeId?: string;
  ownerClientId: string;
  ownerClient?: Client;
  lawyerInCharge?: User;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 法院 / 法庭 / 法官 ====================
export interface Court {
  id: string;
  name: string;
  level: string;
  province: string;
  city: string;
  district: string;
  address: string;
  phone?: string;
  contactName?: string;
}

export interface CourtRoom {
  id: string;
  courtId: string;
  roomNo: string;
  roomName?: string;
  capacity?: number;
  floor?: string;
  court?: Court;
}

export interface Judge {
  id: string;
  courtId: string;
  name: string;
  title?: string;
  department?: string;
  phone?: string;
  email?: string;
  court?: Court;
}

// ==================== 开庭 ====================
export interface HearingAssignment {
  id: string;
  hearingId: string;
  assigneeId: string;
  role: string;
  isLead: boolean;
  notes?: string;
  assignee?: User;
}

export interface Hearing {
  id: string;
  hearingNo: string;
  caseId: string;
  courtId: string;
  courtRoomId: string;
  presidingJudgeId?: string;
  startTime: string;
  endTime: string;
  hearingType: string;
  judgeSummary?: string;
  preparationItems?: string;
  materials?: string;
  status: HearingStatus;
  isImportant: boolean;
  priority: number;
  creatorId: string;
  caseInfo?: Case;
  court?: Court;
  courtRoom?: CourtRoom;
  presidingJudge?: Judge;
  creator?: User;
  assignments?: HearingAssignment[];
  attendance?: AttendanceRecord[];
  timelines?: StatusTimeline[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 冲突检测 ====================
export interface ConflictCheck {
  id: string;
  hearingId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  description: string;
  involvedPartyA?: string;
  involvedPartyB?: string;
  partyAType?: string;
  partyBType?: string;
  partyAName?: string;
  partyBName?: string;
  caseId?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  hearing?: Hearing;
  case?: Case;
  createdAt: string;
}

// ==================== 改约 ====================
export interface RescheduleRecord {
  id: string;
  originalHearingId: string;
  rescheduledHearingId?: string;
  oldStartTime: string;
  oldEndTime: string;
  newStartTime?: string;
  newEndTime?: string;
  reason: RescheduleReason;
  reasonDetail?: string;
  initiatedBy?: string;
  approverId?: string;
  approvedAt?: string;
  isApproved: boolean;
  affectedParties?: any;
  notificationStatus?: string;
  notes?: string;
  originalHearing?: Hearing;
  rescheduledHearing?: Hearing;
  createdAt: string;
}

// ==================== 到场状态 ====================
export interface AttendanceRecord {
  id: string;
  hearingId: string;
  attendeeType: string;
  userId?: string;
  clientId?: string;
  personName: string;
  plannedRole?: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  seatLocation?: string;
  signType?: string;
  remark?: string;
  recordedBy?: string;
  hearing?: Hearing;
  user?: User;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

// ==================== 时间线 ====================
export interface StatusTimeline {
  id: string;
  hearingId: string;
  previousStatus?: string;
  newStatus: string;
  changeType: string;
  description?: string;
  operatorId: string;
  operatorName: string;
  changeReason?: string;
  metadata?: any;
  hearing?: Hearing;
  createdAt: string;
}

// ==================== 提醒 ====================
export interface ReminderRecipient {
  id: string;
  reminderId: string;
  userId?: string;
  clientId?: string;
  recipientName: string;
  recipientContact: string;
  contactType: string;
  status: ReminderStatus;
  readAt?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  failReason?: string;
}

export interface Reminder {
  id: string;
  hearingId: string;
  reminderType: ReminderType;
  title: string;
  content: string;
  scheduledTime: string;
  sentAt?: string;
  status: ReminderStatus;
  senderId?: string;
  templateCode?: string;
  retryCount: number;
  errorMessage?: string;
  hearing?: Hearing;
  recipients?: ReminderRecipient[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 异常单 ====================
export interface ExceptionAttachment {
  id: string;
  exceptionId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
}

export interface ExceptionTimeline {
  id: string;
  exceptionId: string;
  action: string;
  description?: string;
  operatorName: string;
  operatorId?: string;
  statusChange?: string;
  metadata?: any;
  createdAt: string;
}

export interface ExceptionRecord {
  id: string;
  exceptionNo: string;
  hearingId?: string;
  caseId?: string;
  exceptionType: ExceptionType;
  title: string;
  description: string;
  severity: ConflictSeverity;
  status: ExceptionStatus;
  impactScope?: {
    cases?: { id: string; name: string }[];
    hearings?: { id: string; hearingNo: string }[];
    users?: { id: string; name: string }[];
    clients?: { id: string; name: string }[];
    note?: string;
  };
  responsibility?: {
    primaryResponsible?: { id: string; name: string }[];
    secondaryResponsible?: { id: string; name: string }[];
    department?: string;
    rootCause?: string;
    analysisResult?: string;
  };
  investigationResult?: string;
  handlingResult?: string;
  correctiveAction?: string;
  preventiveMeasure?: string;
  relatedConflictIds: string[];
  relatedHearingIds: string[];
  estimatedLoss?: string;
  actualLoss?: string;
  customerSatisfaction?: string;
  creatorId: string;
  resolverId?: string;
  hearing?: Hearing;
  case?: Case;
  creator?: User;
  resolver?: User;
  attachments?: ExceptionAttachment[];
  timeline?: ExceptionTimeline[];
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  updatedAt: string;
}

// ==================== 导出 ====================
export enum ExportType {
  HEARING_SUMMARY = 'HEARING_SUMMARY',
  ATTENDANCE_STATS = 'ATTENDANCE_STATS',
  EXCEPTION_STATS = 'EXCEPTION_STATS',
  CONFLICT_STATS = 'CONFLICT_STATS',
  REMINDER_SUMMARY = 'REMINDER_SUMMARY',
  CASE_SUMMARY = 'CASE_SUMMARY',
}

export interface ExportRecord {
  id: string;
  exportType: ExportType;
  fileName: string;
  fileUrl?: string;
  startTimeRange: string;
  endTimeRange: string;
  filterCriteria?: any;
  includedFields: string[];
  caliberNote: string;
  summaryData?: any;
  recordCount: number;
  exportedById: string;
  exportedByName: string;
  createdAt: string;
}

// ==================== 状态颜色映射 ====================
export const STATUS_COLOR_MAP: Record<string, string> = {
  [HearingStatus.SCHEDULED]: 'blue',
  [HearingStatus.CONFIRMED]: 'cyan',
  [HearingStatus.IN_PROGRESS]: 'processing',
  [HearingStatus.COMPLETED]: 'success',
  [HearingStatus.RESCHEDULED]: 'orange',
  [HearingStatus.CANCELLED]: 'default',
  [HearingStatus.POSTPONED]: 'warning',
  [AttendanceStatus.NOT_ARRIVED]: 'default',
  [AttendanceStatus.ARRIVED]: 'success',
  [AttendanceStatus.LATE]: 'orange',
  [AttendanceStatus.ABSENT]: 'error',
  [AttendanceStatus.EXCUSED]: 'purple',
  [AttendanceStatus.LEAVE_EARLY]: 'warning',
  [ConflictSeverity.LOW]: 'blue',
  [ConflictSeverity.MEDIUM]: 'gold',
  [ConflictSeverity.HIGH]: 'orange',
  [ConflictSeverity.CRITICAL]: 'red',
  [ExceptionStatus.OPEN]: 'red',
  [ExceptionStatus.INVESTIGATING]: 'processing',
  [ExceptionStatus.RESOLVED]: 'cyan',
  [ExceptionStatus.CLOSED]: 'success',
  [ExceptionStatus.ESCALATED]: 'warning',
};

export const STATUS_LABEL_MAP: Record<string, string> = {
  [HearingStatus.SCHEDULED]: '已排期',
  [HearingStatus.CONFIRMED]: '已确认',
  [HearingStatus.IN_PROGRESS]: '进行中',
  [HearingStatus.COMPLETED]: '已完成',
  [HearingStatus.RESCHEDULED]: '已改期',
  [HearingStatus.CANCELLED]: '已取消',
  [HearingStatus.POSTPONED]: '延期',
  [AttendanceStatus.NOT_ARRIVED]: '未到场',
  [AttendanceStatus.ARRIVED]: '已到场',
  [AttendanceStatus.LATE]: '迟到',
  [AttendanceStatus.ABSENT]: '缺席',
  [AttendanceStatus.EXCUSED]: '请假',
  [AttendanceStatus.LEAVE_EARLY]: '早退',
  [ConflictSeverity.LOW]: '低',
  [ConflictSeverity.MEDIUM]: '中',
  [ConflictSeverity.HIGH]: '高',
  [ConflictSeverity.CRITICAL]: '严重',
  [ExceptionStatus.OPEN]: '待处理',
  [ExceptionStatus.INVESTIGATING]: '调查中',
  [ExceptionStatus.RESOLVED]: '已解决',
  [ExceptionStatus.CLOSED]: '已关闭',
  [ExceptionStatus.ESCALATED]: '已升级',
  [ConflictType.LAWYER_TIME]: '律师时间冲突',
  [ConflictType.COURT_ROOM]: '法庭冲突',
  [ConflictType.CLIENT_CONFLICT]: '客户利益冲突',
  [ConflictType.JUDGE_TIME]: '法官时间冲突',
  [ConflictType.CASE_CONFLICT]: '案件对立冲突',
  [ConflictType.OTHER]: '其他冲突',
  [ReminderStatus.PENDING]: '待发送',
  [ReminderStatus.SENT]: '已发送',
  [ReminderStatus.FAILED]: '发送失败',
  [ReminderStatus.READ]: '已读',
  [ReminderStatus.CONFIRMED]: '已确认',
};
