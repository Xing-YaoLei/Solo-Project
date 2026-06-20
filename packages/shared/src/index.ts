export type UserRole = 'VISITOR' | 'TICKET_STAFF' | 'PATROL_STAFF' | 'OPERATOR' | 'SUPERVISOR';

export type ComplaintStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PROCESSING'
  | 'SUPPLEMENTING'
  | 'REJECTED'
  | 'OVERDUE'
  | 'VISITING'
  | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintSource = 'ONLINE' | 'TICKET' | 'ON_SITE' | 'PHONE';

export type DepartmentType = 'DEPARTMENT' | 'POSITION' | 'STAFF';

export type FileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  departmentId?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  type: DepartmentType;
  parentId?: string;
  sortOrder: number;
  children?: Department[];
}

export interface Tag {
  id: string;
  name: string;
  code: string;
  color: string;
  parentId?: string;
  sortOrder: number;
}

export interface Attachment {
  id: string;
  complaintId: string;
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  fileSize: number;
  uploadedBy: string;
  createdAt: Date;
}

export interface Assignment {
  id: string;
  complaintId: string;
  fromUserId?: string;
  toUserId: string;
  reason?: string;
  createdAt: Date;
}

export interface UpgradeRecord {
  id: string;
  complaintId: string;
  fromLevel: number;
  toLevel: number;
  operatorId: string;
  reason: string;
  createdAt: Date;
}

export interface VisitResult {
  id: string;
  complaintId: string;
  operatorId: string;
  satisfaction: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  needFollowUp: boolean;
  visitedAt: Date;
}

export interface OperationLog {
  id: string;
  complaintId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  detail: string;
  createdAt: Date;
}

export interface Complaint {
  id: string;
  code: string;
  title: string;
  content: string;
  source: ComplaintSource;
  status: ComplaintStatus;
  priority: Priority;
  visitorName: string;
  visitorPhone: string;
  visitorIdCard?: string;
  ticketNo?: string;
  location?: string;
  deadlineAt: Date;
  closedAt?: Date;
  closeDurationMinutes?: number;
  ownerId?: string;
  owner?: User;
  departmentId?: string;
  department?: Department;
  tags: Tag[];
  attachments: Attachment[];
  visitResult?: VisitResult;
  assignments: Assignment[];
  upgradeRecords: UpgradeRecord[];
  operationLogs: OperationLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SensitiveFieldConfig {
  field: string;
  label: string;
  roles: UserRole[];
  maskPattern?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ComplaintListQuery {
  page?: number;
  pageSize?: number;
  status?: ComplaintStatus | ComplaintStatus[] | null;
  priority?: Priority | Priority[] | null;
  ownerId?: string | null;
  departmentId?: string | null;
  tagId?: string | null;
  keyword?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  sortBy?: 'createdAt' | 'deadlineAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface CloseDurationStats {
  range: string;
  count: number;
  avgMinutes: number;
}

export interface DateTrendStats {
  date: string;
  total: number;
  resolved: number;
  overdue: number;
}

export interface OwnerDrillStats {
  ownerId: string;
  ownerName: string;
  totalCount: number;
  closedCount: number;
  avgDurationMinutes: number;
  avgSatisfaction: number;
  overdueCount: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  VISITOR: '游客',
  TICKET_STAFF: '票务员',
  PATROL_STAFF: '巡场员',
  OPERATOR: '运营专员',
  SUPERVISOR: '运营主管',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  PENDING: '待分派',
  ASSIGNED: '已分派',
  PROCESSING: '处理中',
  SUPPLEMENTING: '待补材料',
  REJECTED: '已驳回',
  OVERDUE: '已超时',
  VISITING: '待回访',
  CLOSED: '已关闭',
};

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  PENDING: '#94a3b8',
  ASSIGNED: '#3b82f6',
  PROCESSING: '#6366f1',
  SUPPLEMENTING: '#f59e0b',
  REJECTED: '#ef4444',
  OVERDUE: '#dc2626',
  VISITING: '#8b5cf6',
  CLOSED: '#10b981',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

export const SOURCE_LABELS: Record<ComplaintSource, string> = {
  ONLINE: '线上提交',
  TICKET: '票务窗口',
  ON_SITE: '现场投诉',
  PHONE: '电话投诉',
};
