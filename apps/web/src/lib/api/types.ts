export enum UserRole {
  AUDITOR = 'AUDITOR',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  COMPLIANCE_OFFICER = 'COMPLIANCE_OFFICER',
  MANAGEMENT = 'MANAGEMENT',
  ADMIN = 'ADMIN',
}

export enum Permission {
  TASK_CREATE = 'TASK_CREATE',
  TASK_ASSIGN = 'TASK_ASSIGN',
  TASK_VIEW = 'TASK_VIEW',
  TASK_EDIT = 'TASK_EDIT',
  TASK_BATCH_UPDATE = 'TASK_BATCH_UPDATE',
  TASK_DELETE = 'TASK_DELETE',
  EVIDENCE_CREATE = 'EVIDENCE_CREATE',
  EVIDENCE_UPLOAD = 'EVIDENCE_UPLOAD',
  EVIDENCE_VIEW = 'EVIDENCE_VIEW',
  EVIDENCE_EDIT = 'EVIDENCE_EDIT',
  EVIDENCE_SUBMIT = 'EVIDENCE_SUBMIT',
  EVIDENCE_DELETE = 'EVIDENCE_DELETE',
  REVIEW_CONDUCT = 'REVIEW_CONDUCT',
  REVIEW_APPROVE = 'REVIEW_APPROVE',
  REVIEW_REJECT = 'REVIEW_REJECT',
  REVIEW_VIEW = 'REVIEW_VIEW',
  CHECKLIST_CREATE = 'CHECKLIST_CREATE',
  CHECKLIST_VIEW = 'CHECKLIST_VIEW',
  CHECKLIST_EDIT = 'CHECKLIST_EDIT',
  CHECKLIST_EXECUTE = 'CHECKLIST_EXECUTE',
  SAMPLING_CREATE = 'SAMPLING_CREATE',
  SAMPLING_VIEW = 'SAMPLING_VIEW',
  SAMPLING_EDIT = 'SAMPLING_EDIT',
  SAMPLING_APPROVE = 'SAMPLING_APPROVE',
  TEMPLATE_CREATE = 'TEMPLATE_CREATE',
  TEMPLATE_VIEW = 'TEMPLATE_VIEW',
  TEMPLATE_EDIT = 'TEMPLATE_EDIT',
  TEMPLATE_USE = 'TEMPLATE_USE',
  STATISTICS_VIEW = 'STATISTICS_VIEW',
  STATISTICS_EXPORT = 'STATISTICS_EXPORT',
  USER_MANAGE = 'USER_MANAGE',
  ROLE_MANAGE = 'ROLE_MANAGE',
  AUDIT_LOG_VIEW = 'AUDIT_LOG_VIEW',
  UNAUTHORIZED_VIEW = 'UNAUTHORIZED_VIEW',
}

export enum TaskStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum AuditType {
  ROUTINE = 'ROUTINE',
  SPECIAL = 'SPECIAL',
  COMPLIANCE = 'COMPLIANCE',
  INVESTIGATION = 'INVESTIGATION',
}

export enum EvidenceStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEED_SUPPLEMENT = 'NEED_SUPPLEMENT',
  ARCHIVED = 'ARCHIVED',
}

export enum EvidenceCategory {
  DOCUMENT = 'DOCUMENT',
  FINANCIAL = 'FINANCIAL',
  CONTRACT = 'CONTRACT',
  REPORT = 'REPORT',
  RECORD = 'RECORD',
  MEETING_MINUTE = 'MEETING_MINUTE',
  OTHER = 'OTHER',
}

export enum ReviewResult {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEED_REVISION = 'NEED_REVISION',
}

export enum ReviewTargetType {
  EVIDENCE = 'EVIDENCE',
  TASK = 'TASK',
  CHECKLIST = 'CHECKLIST',
  SAMPLING = 'SAMPLING',
}

export enum SamplingMethod {
  RANDOM = 'RANDOM',
  SYSTEMATIC = 'SYSTEMATIC',
  STRATIFIED = 'STRATIFIED',
  JUDGMENT = 'JUDGMENT',
  BLOCK = 'BLOCK',
}

export enum SamplingStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum IssueSeverity {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

export enum IssueStatus {
  IDENTIFIED = 'IDENTIFIED',
  MITIGATING = 'MITIGATING',
  RESOLVED = 'RESOLVED',
  RECURRED = 'RECURRED',
  CLOSED = 'CLOSED',
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DUE_REMINDER = 'TASK_DUE_REMINDER',
  EVIDENCE_REVIEW_NEEDED = 'EVIDENCE_REVIEW_NEEDED',
  EVIDENCE_REVIEWED = 'EVIDENCE_REVIEWED',
  SUPPLEMENT_REQUESTED = 'SUPPLEMENT_REQUESTED',
  SUPPLEMENT_COMPLETED = 'SUPPLEMENT_COMPLETED',
  CHECKLIST_DUE = 'CHECKLIST_DUE',
  SYSTEM = 'SYSTEM',
}

export enum OperationAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT = 'SUBMIT',
  REVIEW = 'REVIEW',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ASSIGN = 'ASSIGN',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
  BATCH_UPDATE = 'BATCH_UPDATE',
  ARCHIVE = 'ARCHIVE',
  UNARCHIVE = 'UNARCHIVE',
}

export enum UnauthorizedSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum UnauthorizedStatus {
  PENDING = 'PENDING',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditTask {
  id: string;
  taskNo: string;
  title: string;
  description?: string;
  auditType: AuditType;
  priority: TaskPriority;
  status: TaskStatus;
  department?: string;
  auditPeriod?: string;
  createdById: string;
  createdBy?: User;
  assignedToId?: string;
  assignedTo?: User;
  businessOwnerId?: string;
  businessOwner?: User;
  dueDate?: string;
  assignedAt?: string;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  relatedTaskIds: string[];
  evidences?: Evidence[];
  reviews?: ReviewRecord[];
  checklistExecs?: ChecklistExecution[];
  samplingRecords?: SamplingRecord[];
  _count?: {
    evidences: number;
    reviews: number;
    checklistExecs: number;
    samplingRecords: number;
  };
}

export interface Evidence {
  id: string;
  evidenceNo: string;
  title: string;
  description?: string;
  category: EvidenceCategory;
  status: EvidenceStatus;
  taskId: string;
  task?: AuditTask;
  submittedById?: string;
  submittedBy?: User;
  relatedDocumentNo?: string;
  relatedDocumentType?: string;
  relatedDocumentDate?: string;
  relatedDocumentAmount?: number;
  submittedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  reviews?: ReviewRecord[];
  supplementHistory?: EvidenceSupplement[];
  _count?: {
    attachments: number;
    reviews: number;
    supplementHistory: number;
  };
}

export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType?: string;
  fileHash?: string;
  evidenceId: string;
  version: number;
  isSupplement: boolean;
  uploadedById?: string;
  uploadedBy?: User;
  createdAt: string;
}

export interface EvidenceSupplement {
  id: string;
  evidenceId: string;
  reason: string;
  requestedById: string;
  requestedBy?: User;
  requestedAt: string;
  completedAt?: string;
  isCompleted: boolean;
  supplementAttachments?: Attachment[];
}

export interface ReviewRecord {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  evidenceId?: string;
  evidence?: Evidence;
  taskId?: string;
  task?: AuditTask;
  reviewerId: string;
  reviewer?: User;
  result: ReviewResult;
  comment?: string;
  reviewRound: number;
  reviewedAt: string;
  createdAt: string;
  snapshot?: any;
}

export interface Checklist {
  id: string;
  title: string;
  description?: string;
  category?: string;
  version?: string;
  isActive: boolean;
  createdById: string;
  createdBy?: User;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
  };
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  order: number;
  content: string;
  requirement?: string;
  evidenceNeeded: boolean;
  createdAt: string;
}

export interface ChecklistExecution {
  id: string;
  checklistId: string;
  checklist?: Checklist;
  taskId: string;
  task?: AuditTask;
  executedById: string;
  executedBy?: User;
  startedAt: string;
  completedAt?: string;
  results?: ChecklistItemResult[];
}

export interface ChecklistItemResult {
  id: string;
  executionId: string;
  itemId: string;
  item?: ChecklistItem;
  isPass?: boolean;
  remark?: string;
  evidenceId?: string;
  evidence?: Evidence;
  checkedById?: string;
  checkedBy?: User;
  checkedAt?: string;
}

export interface SamplingRecord {
  id: string;
  samplingNo: string;
  title: string;
  taskId: string;
  task?: AuditTask;
  method: SamplingMethod;
  population: number;
  sampleSize: number;
  confidenceLevel?: number;
  createdById: string;
  createdBy?: User;
  approvedById?: string;
  approvedBy?: User;
  status: SamplingStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  samples?: SamplingItem[];
}

export interface SamplingItem {
  id: string;
  samplingId: string;
  itemNo: string;
  documentNo?: string;
  description?: string;
  amount?: number;
  isDefect?: boolean;
  defectType?: string;
  defectLevel?: string;
  remark?: string;
  evidenceId?: string;
  evidence?: Evidence;
  createdAt: string;
}

export interface Issue {
  id: string;
  issueNo: string;
  title: string;
  description?: string;
  severity: IssueSeverity;
  status: IssueStatus;
  isRecurred: boolean;
  taskId?: string;
  task?: AuditTask;
  evidenceId?: string;
  evidence?: Evidence;
  samplingItemId?: string;
  samplingItem?: SamplingItem;
  parentIssueId?: string;
  parentIssue?: Issue;
  childIssues?: Issue[];
  recurrenceCount: number;
  category?: string;
  subCategory?: string;
  department?: string;
  identifiedAt: string;
  resolvedAt?: string;
  dueDate?: string;
  createdById: string;
  createdBy?: User;
  ownerId?: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content?: string;
  recipientId: string;
  recipient?: User;
  taskId?: string;
  task?: AuditTask;
  evidenceId?: string;
  evidence?: Evidence;
  isRead: boolean;
  readAt?: string;
  actionType?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  version: number;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface OperationLog {
  id: string;
  operatorId: string;
  operator?: User;
  operatorName: string;
  targetType: string;
  targetId: string;
  action: OperationAction;
  description?: string;
  beforeData?: any;
  afterData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  taskId?: string;
  task?: AuditTask;
  evidenceId?: string;
  evidence?: Evidence;
}

export interface UnauthorizedAccess {
  id: string;
  userId: string;
  user?: User;
  userName: string;
  userRole: UserRole;
  resourceType: string;
  resourceId: string;
  resourceTitle?: string;
  action: string;
  attemptedPermission?: Permission;
  severity: UnauthorizedSeverity;
  status: UnauthorizedStatus;
  handledById?: string;
  handledBy?: User;
  handlingNote?: string;
  handledAt?: string;
  ipAddress?: string;
  userAgent?: string;
  requestParams?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface KanbanColumn {
  status: TaskStatus;
  tasks: AuditTask[];
}

export interface KanbanData {
  kanban: Record<string, AuditTask[]>;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
  };
}

export interface DashboardStats {
  summary: {
    totalTasks: number;
    totalEvidences: number;
    totalIssues: number;
    totalUsers: number;
    taskCompletionRate: string;
    evidenceApprovalRate: string;
  };
  taskStatus: {
    pending: number;
    inProgress: number;
    approved: number;
  };
  evidenceStatus: {
    submitted: number;
    approved: number;
  };
  issues: {
    open: number;
    recurred: number;
  };
  weekly: {
    tasks: number;
    evidences: number;
    issues: number;
  };
}

export interface TaskStats {
  total: number;
  overdue: number;
  byStatus: { status: TaskStatus; count: number }[];
  byPriority: { priority: TaskPriority; count: number }[];
  byAuditType: { auditType: AuditType; count: number }[];
  byDepartment: { department: string; count: number }[];
  completionRate: number;
}

export interface EvidenceStats {
  total: number;
  withSupplement: number;
  byStatus: { status: EvidenceStatus; count: number }[];
  byCategory: { category: EvidenceCategory; count: number }[];
  approvalRate: number;
}

export interface IssueStats {
  total: number;
  recurred: number;
  recurrenceRate: string;
  byStatus: { status: IssueStatus; count: number }[];
  bySeverity: { severity: IssueSeverity; count: number }[];
  byCategory: { category: string; count: number }[];
  recurrenceDetails: {
    topRecurred: Issue[];
    totalRecurrenceCount: number;
    averageRecurrence: number;
  };
}

export interface ReviewStats {
  total: number;
  avgRounds: string;
  byResult: { result: ReviewResult; count: number }[];
  byTargetType: { targetType: ReviewTargetType; count: number }[];
  topReviewers: {
    reviewer: User;
    total: number;
    approved: number;
  }[];
}

export interface UserStats {
  total: number;
  byRole: { role: UserRole; count: number }[];
  topTaskAssignees: {
    user: User;
    taskCount: number;
  }[];
}

export interface RecurrenceTrendItem {
  month: string;
  total: number;
  recurred: number;
  rate: string;
}

export interface DrillDownResult {
  dimension: string;
  value: string;
  filters?: { startDate?: string; endDate?: string };
  tasks?: AuditTask[];
  issues?: Issue[];
  evidences?: Evidence[];
}
