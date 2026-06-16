export interface SettlementBill {
  id: number;
  billNo: string;
  patientId: number;
  patientName: string;
  patientNo?: string;
  statusId: number;
  statusName: string;
  sourceChannelId?: number;
  sourceChannelName?: string;
  assigneeId?: number;
  assigneeName?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  totalAmount: number;
  insuranceAmount: number;
  selfPayAmount: number;
  rejectionRemark?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  processedAt?: string;
  items: SettlementItem[];
  reviewTags?: string[];
}

export interface SettlementItem {
  id: number;
  billId: number;
  itemCode?: string;
  itemName: string;
  itemType?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  insuranceCoverage?: number;
  insuranceAmount: number;
  selfPayAmount: number;
  remark?: string;
  sortOrder: number;
}

export interface CreateSettlementBill {
  patientId: number;
  sourceChannelId?: number;
  assigneeId?: number;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  remark?: string;
  items: CreateSettlementItem[];
}

export interface CreateSettlementItem {
  itemCode?: string;
  itemName: string;
  itemType?: string;
  quantity: number;
  unitPrice: number;
  insuranceCoverage?: number;
  remark?: string;
  sortOrder: number;
}

export interface UpdateSettlementBill {
  sourceChannelId?: number;
  assigneeId?: number;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  remark?: string;
  items?: UpdateSettlementItem[];
}

export interface UpdateSettlementItem {
  id?: number;
  itemCode?: string;
  itemName: string;
  itemType?: string;
  quantity: number;
  unitPrice: number;
  insuranceCoverage?: number;
  remark?: string;
  sortOrder: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface BillListQuery {
  statusId?: number;
  assigneeId?: number;
  sourceChannelId?: number;
  searchKeyword?: string;
  startDate?: string;
  endDate?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface TreatmentCalendar {
  id: number;
  billId: number;
  patientId: number;
  patientName: string;
  treatmentDate: string;
  startTime?: string;
  endTime?: string;
  treatmentType?: string;
  treatmentItem?: string;
  doctorId?: number;
  doctorName?: string;
  therapistId?: number;
  therapistName?: string;
  statusId: number;
  statusName: string;
  duration?: number;
  remark?: string;
  createdAt: string;
}

export interface DeviceDto {
  id: number;
  deviceCode: string;
  deviceName: string;
  deviceType?: string;
  model?: string;
  statusId: number;
  statusName: string;
  location?: string;
}

export interface DeviceUsageRecord {
  id: number;
  deviceId: number;
  deviceName: string;
  billId?: number;
  treatmentCalendarId?: number;
  useDate: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  remark?: string;
}

export interface NursingLog {
  id: number;
  billId?: number;
  patientId: number;
  patientName: string;
  treatmentCalendarId?: number;
  logDate: string;
  logTime?: string;
  nurseId?: number;
  nurseName?: string;
  vitalSigns?: string;
  nursingContent?: string;
  patientCondition?: string;
  remark?: string;
  createdAt: string;
}

export interface StatusTransition {
  id: number;
  billId: number;
  fromStatusId?: number;
  toStatusId: number;
  remark?: string;
  operatorName: string;
  createdAt: string;
}

export interface ExceptionRecord {
  id: number;
  billId: number;
  billNo: string;
  exceptionType: string;
  rejectionReasonId?: number;
  rejectionReasonName?: string;
  description?: string;
  handlerId?: number;
  handlerName?: string;
  handleMethod?: string;
  handleRemark?: string;
  handledAt?: string;
  escalatedAt?: string;
  escalatedTo?: number;
  escalatedToName?: string;
  isClosed: boolean;
  closedAt?: string;
  createdAt: string;
  supplementMaterials: SupplementMaterial[];
}

export interface SupplementMaterial {
  id: number;
  exceptionRecordId: number;
  billId: number;
  materialName: string;
  materialType?: string;
  fileUrl?: string;
  remark?: string;
  createdAt: string;
}

export interface SettlementBillDetail {
  bill: SettlementBill;
  treatmentCalendars: TreatmentCalendar[];
  nursingLogs: NursingLog[];
  deviceUsageRecords: DeviceUsageRecord[];
  statusTransitions: StatusTransition[];
  exceptionRecords: ExceptionRecord[];
}

export interface DashboardDto {
  totalBills: number;
  pendingBills: number;
  completedBills: number;
  exceptionBills: number;
  totalAmount: number;
  insuranceAmount: number;
  statusOverview: StatusOverview[];
  sourceChannelStats: SourceChannelStatistics[];
  trainingCompletionRate: TrainingCompletionRate;
}

export interface StatusOverview {
  statusId: number;
  statusName: string;
  count: number;
  amount: number;
}

export interface SourceChannelStatistics {
  sourceChannelId: number;
  sourceChannelName: string;
  billCount: number;
  totalAmount: number;
  insuranceAmount: number;
  rate: number;
}

export interface TrainingCompletionRate {
  totalScheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
}

export interface AssigneeStatistics {
  assigneeId?: number;
  assigneeName: string;
  billCount: number;
  completedCount: number;
  pendingCount: number;
  rejectedCount: number;
  completedRate: number;
}

export interface ReviewTagStatistics {
  reviewTagId: number;
  reviewTagName: string;
  billCount: number;
  totalAmount: number;
  color?: string;
}

export enum SettlementStatus {
  PendingEntry = 1,
  PendingReview = 2,
  ReviewApproved = 3,
  ReviewRejected = 4,
  Processing = 5,
  PendingFinalReview = 6,
  Completed = 7,
  Closed = 8,
  InsuranceRejected = 9,
  SupplementingMaterials = 10,
  Escalated = 11,
}

export const SettlementStatusMap: Record<number, { name: string; color: string }> = {
  1: { name: '待录入', color: 'default' },
  2: { name: '待审核', color: 'blue' },
  3: { name: '审核通过', color: 'cyan' },
  4: { name: '审核驳回', color: 'orange' },
  5: { name: '处理中', color: 'geekblue' },
  6: { name: '待复盘', color: 'purple' },
  7: { name: '已完成', color: 'green' },
  8: { name: '已关闭', color: 'default' },
  9: { name: '医保拒付', color: 'red' },
  10: { name: '补充材料中', color: 'warning' },
  11: { name: '升级处理', color: 'magenta' },
};
