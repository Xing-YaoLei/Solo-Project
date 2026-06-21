export interface Case {
  id: string;
  caseNumber: string;
  caseName: string;
  caseType: string;
  clientId: string;
  clientName: string;
  createdAt: Date;
}

export type AttendanceStatus = 'ATTENDED' | 'ABSENT' | 'POSTPONED' | 'CANCELLED';

export interface Hearing {
  id: string;
  caseId: string;
  hearingDate: Date;
  hearingTime: string;
  court: string;
  judge?: string;
  attendanceStatus: AttendanceStatus;
  caseSystemVersion: string;
  calendarToolVersion: string;
  emailAttachmentVersion: string;
  hasConflict: boolean;
  conflictId?: string;
  capacityRule?: string;
  anomalyExplanation?: string;
  createdAt: Date;
  updatedAt: Date;
  case?: Case;
  conflict?: Conflict;
}

export type DataSource = 'CASE_SYSTEM' | 'CALENDAR_TOOL' | 'EMAIL_ATTACHMENT';

export interface DataVersion {
  id: string;
  source: DataSource;
  version: string;
  snapshotData: Record<string, unknown>;
  importDate: Date;
  importedBy: string;
}

export type ConflictStatus = 'PENDING' | 'RESOLVED' | 'ESCALATED';

export interface Conflict {
  id: string;
  caseId: string;
  hearingId?: string;
  conflictType: string;
  description: string;
  status: ConflictStatus;
  dataGapStart?: Date;
  dataGapEnd?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  case?: Case;
}

export interface Satisfaction {
  id: string;
  caseId: string;
  clientId: string;
  clientName: string;
  rating: number;
  feedback?: string;
  surveyDate: Date;
  improvementMeasures?: string;
  followUpRating?: number;
  followUpDate?: Date;
  case?: Case;
}

export type ReminderType = 'EMAIL' | 'SMS' | 'CALENDAR';
export type ReminderStatus = 'SENT' | 'FAILED' | 'OPENED';

export interface Reminder {
  id: string;
  hearingId: string;
  recipient: string;
  recipientType: string;
  reminderType: ReminderType;
  sentAt: Date;
  status: ReminderStatus;
}

export interface FilterParams {
  dateRange?: { start: Date; end: Date };
  caseTypes?: string[];
  attendanceStatuses?: AttendanceStatus[];
  hasConflicts?: boolean;
  timeSlots?: string[];
  reminderStatuses?: ReminderStatus[];
}

export interface Discrepancy {
  hearingId: string;
  field: string;
  caseSystemValue: unknown;
  calendarToolValue: unknown;
  emailAttachmentValue: unknown;
}

export interface CompareResponse {
  caseSystemData: Hearing[];
  calendarToolData: Hearing[];
  emailAttachmentData: Hearing[];
  discrepancies: Discrepancy[];
}

export interface FunnelDataPoint {
  name: string;
  value: number;
  fill: string;
}

export interface KpiData {
  totalHearings: number;
  attendanceRate: number;
  conflictRate: number;
  avgSatisfaction: number;
  pendingConflicts: number;
  postponedCount: number;
}

export interface CapacityRule {
  id: string;
  name: string;
  description: string;
  maxDailyHearings: number;
  maxWeeklyHearings: number;
  timeSlotStart: string;
  timeSlotEnd: string;
}

export interface AnomalyInfo {
  hearingId: string;
  type: string;
  description: string;
  capacityRule?: CapacityRule;
}
