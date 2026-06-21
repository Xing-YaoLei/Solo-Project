export enum HearingStatus {
  Draft = 0, Scheduled = 1, Confirmed = 2, Completed = 3, Cancelled = 4, Postponed = 5
}
export enum UserRole { Lawyer = 0, Assistant = 1, Partner = 2, Client = 3 }
export enum AttendanceStatus { Pending = 0, Present = 1, Absent = 2, Late = 3, Excused = 4 }
export enum ReminderType { OneDayBefore = 0, ThreeHoursBefore = 1, OneHourBefore = 2, Custom = 3 }
export enum ReminderStatus { Pending = 0, Sent = 1, Failed = 2, Acknowledged = 3 }
export enum ConflictType { SameClient = 0, OpposingPartyRelation = 1, PriorRepresentation = 2, PersonalRelationship = 3, Other = 4 }
export enum ConflictResolutionStatus { Detected = 0, UnderReview = 1, Resolved = 2, Escalated = 3, Waived = 4 }
export enum AttachmentType { Evidence = 0, Pleading = 1, CourtDocument = 2, ConflictDisclosure = 3, Other = 4 }

export interface HearingSchedule {
  id: string; caseNumber: string; caseName: string; courtName: string; courtRoom: string;
  hearingDate: string; startTime: string; endTime: string; status: HearingStatus;
  isConflictFlagged: boolean; conflictId?: string; createdBy: string;
  assignedLawyerId?: string; notes?: string; createdAt: string; updatedAt: string;
  participants?: Participant[]; attachments?: Attachment[]; statusLogs?: StatusLog[];
}
export interface Participant {
  id: string; hearingId: string; userId: string; fullName: string; role: string;
  attendanceStatus: AttendanceStatus; checkInTime?: string; notes?: string;
}
export interface Attachment {
  id: string; hearingId: string; fileName: string; filePath: string; fileType: string;
  fileSize: number; attachmentType: AttachmentType; uploadedBy: string; description?: string; createdAt: string;
}
export interface StatusLog {
  id: string; hearingId: string; fromStatus: HearingStatus; toStatus: HearingStatus;
  changedBy: string; reason?: string; relatedAttachmentId?: string; createdAt: string;
}
export interface ConflictOfInterest {
  id: string; hearingId: string; conflictType: ConflictType; description: string;
  detectedBy: string; detectedAt: string; resolutionStatus: ConflictResolutionStatus;
  resolution?: string; resolvedBy?: string; resolvedAt?: string; relatedAttachmentId?: string;
}
export interface CalendarSlot {
  id: string; date: string; startTime: string; endTime: string; courtRoom: string;
  maxCapacity: number; currentCount: number;
}
export interface CapacityRule {
  id: string; courtRoom: string; maxHearingsPerSlot: number; maxParticipantsPerHearing: number;
  isActive: boolean; effectiveFrom: string; effectiveTo?: string;
}
export interface Reminder {
  id: string; hearingId: string; reminderType: ReminderType; status: ReminderStatus;
  remindAt: string; sentAt?: string; targetUserId: string; message?: string;
}
export interface User {
  id: string; username: string; email: string; fullName: string; role: UserRole;
  department?: string; isActive: boolean;
}
export interface ClientFeedback {
  hearingId: string; clientId: string; satisfactionScore: number; comments?: string; submittedAt: string;
}
export interface StatisticsOverview {
  totalHearings: number; completedHearings: number; cancelledHearings: number;
  conflictsDetected: number; avgSatisfactionScore: number; hearingsThisMonth: number; hearingsThisWeek: number;
}
export interface ClientSatisfactionReport {
  clientId: string; clientName: string; avgScore: number; hearingCount: number;
  feedbacks: { hearingId: string; caseNumber: string; satisfactionScore: number; comments?: string; submittedAt: string }[];
}
export interface HearingStatistics {
  date: string; total: number; completed: number; cancelled: number; conflictCount: number;
}
export interface PagedResult<T> {
  items: T[]; totalCount: number; page: number; pageSize: number; totalPages: number;
}
export interface LoginRequest { username: string; password: string }
export interface LoginResponse { token: string; expiresAt: string; userRole: UserRole; userId: string; fullName: string }

export const HearingStatusLabel: Record<HearingStatus, string> = {
  [HearingStatus.Draft]: '草稿', [HearingStatus.Scheduled]: '已排期',
  [HearingStatus.Confirmed]: '已确认', [HearingStatus.Completed]: '已完成',
  [HearingStatus.Cancelled]: '已取消', [HearingStatus.Postponed]: '已延期',
};
export const AttendanceStatusLabel: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Pending]: '待确认', [AttendanceStatus.Present]: '已到场',
  [AttendanceStatus.Absent]: '缺席', [AttendanceStatus.Late]: '迟到', [AttendanceStatus.Excused]: '请假',
};
export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.Lawyer]: '律师', [UserRole.Assistant]: '助理',
  [UserRole.Partner]: '合伙人', [UserRole.Client]: '客户',
};
export const ConflictTypeLabel: Record<ConflictType, string> = {
  [ConflictType.SameClient]: '同一客户', [ConflictType.OpposingPartyRelation]: '对方当事人关联',
  [ConflictType.PriorRepresentation]: '先前代理', [ConflictType.PersonalRelationship]: '私人关系', [ConflictType.Other]: '其他',
};
export const ConflictResolutionStatusLabel: Record<ConflictResolutionStatus, string> = {
  [ConflictResolutionStatus.Detected]: '已检测', [ConflictResolutionStatus.UnderReview]: '审核中',
  [ConflictResolutionStatus.Resolved]: '已解决', [ConflictResolutionStatus.Escalated]: '已升级', [ConflictResolutionStatus.Waived]: '已豁免',
};
export const AttachmentTypeLabel: Record<AttachmentType, string> = {
  [AttachmentType.Evidence]: '证据材料', [AttachmentType.Pleading]: '诉状',
  [AttachmentType.CourtDocument]: '法院文书', [AttachmentType.ConflictDisclosure]: '冲突披露', [AttachmentType.Other]: '其他',
};
