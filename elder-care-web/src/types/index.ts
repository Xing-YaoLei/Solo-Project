export interface Area {
  id: number;
  name: string;
  description: string;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string;
  areaId: number;
  areaName?: string;
}

export interface ElderlyProfile {
  id: number;
  name: string;
  gender: string;
  birthDate: string;
  roomNumber: string;
  areaId: number;
  areaName?: string;
  primaryStaffId: number;
  primaryStaffName?: string;
  healthConditions: string;
  emergencyContact: string;
  emergencyPhone: string;
  admissionDate: string;
  status: string;
}

export interface MedicationDictionary {
  id: number;
  medicineName: string;
  genericName: string;
  dosageForm: string;
  defaultDosage: string;
  unit: string;
  frequency: string;
  category: string;
  sideEffects: string;
  contraindications: string;
  isActive: boolean;
}

export interface MedicationSchedule {
  id: number;
  elderlyId: number;
  elderlyName?: string;
  medicationDictId: number;
  medicineName?: string;
  dosage: string;
  frequency: string;
  startTime: string;
  endTime: string;
  timeOfDay: string;
  instructions: string;
  status: string;
  createdByStaffId: number;
  createdByName?: string;
}

export interface MedicationReminderLog {
  id: number;
  scheduleId: number;
  elderlyId: number;
  elderlyName?: string;
  reminderTime: string;
  status: string;
  acknowledgedAt?: string;
  acknowledgedByStaffId?: number;
  acknowledgedByName?: string;
  notes?: string;
}

export interface VisitRecordRule {
  id: number;
  name: string;
  frequencyDays: number;
  requiredDurationMinutes: number;
  areaId: number;
  areaName?: string;
  priority: string;
  isActive: boolean;
}

export interface VisitRecord {
  id: number;
  elderlyId: number;
  elderlyName?: string;
  staffId: number;
  staffName?: string;
  ruleId: number;
  ruleName?: string;
  visitDate: string;
  duration: number;
  status: string;
  notes: string;
  nextVisitDate?: string;
}

export interface ActivityCheckInThreshold {
  id: number;
  activityName: string;
  requiredCheckIns: number;
  periodDays: number;
  areaId: number;
  areaName?: string;
  isActive: boolean;
}

export interface ActivityCheckIn {
  id: number;
  elderlyId: number;
  elderlyName?: string;
  activityName: string;
  staffId: number;
  staffName?: string;
  checkInTime: string;
  status: string;
  thresholdId: number;
  notes?: string;
}

export interface RiskEvent {
  id: number;
  elderlyId: number;
  elderlyName?: string;
  eventType: string;
  severity: string;
  description: string;
  eventTime: string;
  location: string;
  areaId: number;
  areaName?: string;
  reportedByStaffId: number;
  reportedByName?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  status: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface RiskEventReminder {
  id: number;
  riskEventId: number;
  actionType: string;
  staffId: number;
  staffName?: string;
  message: string;
  actionTime: string;
  isSuccessful: boolean;
  retryCount: number;
  parentReminderId?: number;
  notes?: string;
}

export interface CombinedQuery {
  status?: string;
  startDate?: string;
  endDate?: string;
  areaId?: number;
  staffId?: number;
  entityType: 'Elderly' | 'RiskEvent' | 'Schedule' | 'Visit' | 'CheckIn';
  page: number;
  pageSize: number;
}

export type CombinedQueryParams = CombinedQuery;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface RiskEventTimeline {
  riskEvent: RiskEvent;
  reminders: RiskEventReminder[];
}

export interface CheckInStats {
  totalCheckIns: number;
  onTime: number;
  late: number;
  absent: number;
  excused: number;
  complianceRate: number;
}

export interface VisitCompliance {
  totalScheduled: number;
  completed: number;
  missed: number;
  cancelled: number;
  complianceRate: number;
}

export const MedicationStatus = {
  Active: 'Active',
  Paused: 'Paused',
  Completed: 'Completed',
} as const;

export const ReminderStatus = {
  Pending: 'Pending',
  Sent: 'Sent',
  Acknowledged: 'Acknowledged',
  Missed: 'Missed',
} as const;

export const RiskEventType = {
  Fall: 'Fall',
  Wander: 'Wander',
  Choking: 'Choking',
  Other: 'Other',
} as const;

export const RiskEventSeverity = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical',
} as const;

export const ReminderActionType = {
  Pushed: 'Pushed',
  Supplemented: 'Supplemented',
  Retried: 'Retried',
  Closed: 'Closed',
} as const;

export const VisitStatus = {
  Scheduled: 'Scheduled',
  Completed: 'Completed',
  Missed: 'Missed',
  Cancelled: 'Cancelled',
} as const;

export const CheckInStatus = {
  CheckedIn: 'CheckedIn',
  Absent: 'Absent',
  Late: 'Late',
  Excused: 'Excused',
} as const;

export const RiskEventStatus = {
  Open: 'Open',
  Processing: 'Processing',
  Resolved: 'Resolved',
  Closed: 'Closed',
} as const;

export const MedicationStatusLabel: Record<string, string> = {
  Active: '使用中',
  Paused: '已暂停',
  Completed: '已完成',
};

export const ReminderStatusLabel: Record<string, string> = {
  Pending: '待处理',
  Sent: '已发送',
  Acknowledged: '已确认',
  Missed: '已错过',
};

export const RiskEventTypeLabel: Record<string, string> = {
  Fall: '跌倒',
  Wander: '走失',
  Choking: '噎食',
  Other: '其他',
};

export const RiskEventSeverityLabel: Record<string, string> = {
  Low: '低',
  Medium: '中',
  High: '高',
  Critical: '危急',
};

export const ReminderActionTypeLabel: Record<string, string> = {
  Pushed: '已推送',
  Supplemented: '已补录',
  Retried: '已重试',
  Closed: '已关闭',
};

export const VisitStatusLabel: Record<string, string> = {
  Scheduled: '已排期',
  Completed: '已完成',
  Missed: '已错过',
  Cancelled: '已取消',
};

export const CheckInStatusLabel: Record<string, string> = {
  CheckedIn: '已签到',
  Absent: '缺席',
  Late: '迟到',
  Excused: '请假',
};

export const RiskEventStatusLabel: Record<string, string> = {
  Open: '待处理',
  Processing: '处理中',
  Resolved: '已解决',
  Closed: '已关闭',
};
