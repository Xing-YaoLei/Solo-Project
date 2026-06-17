export enum UserRole {
  OWNER = "OWNER",
  DESIGNER = "DESIGNER",
  FOREMAN = "FOREMAN",
  SUPERVISOR = "SUPERVISOR",
}

export enum ChangeOrderStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  DESIGNER_APPROVED = "DESIGNER_APPROVED",
  OWNER_APPROVED = "OWNER_APPROVED",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_ACCEPTANCE = "PENDING_ACCEPTANCE",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum MaterialDelayStatus {
  REPORTED = "REPORTED",
  CONFIRMED = "CONFIRMED",
  RESCHEDULED = "RESCHEDULED",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum AfterSalesStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  PENDING_REVIEW = "PENDING_REVIEW",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum AcceptanceStatus {
  PENDING = "PENDING",
  PASSED = "PASSED",
  FAILED = "FAILED",
  RE_INSPECTED = "RE_INSPECTED",
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  designerId?: string | null;
  foremanId?: string | null;
  supervisorId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  actualEndDate?: Date | null;
  status: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DesignChangeOrder {
  id: string;
  orderNo: string;
  projectId: string;
  title: string;
  description: string;
  reason?: string | null;
  originalDesign?: string | null;
  newDesign?: string | null;
  impactOnSchedule?: number | null;
  impactOnCost?: number | null;
  status: ChangeOrderStatus;
  designerId?: string | null;
  submittedById?: string | null;
  approvedAt?: Date | null;
  completedAt?: Date | null;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  designer?: User | null;
  submittedBy?: User | null;
}

export interface AcceptancePhoto {
  id: string;
  changeOrderId: string;
  uploaderId: string;
  photoUrl: string;
  thumbnailUrl?: string | null;
  description?: string | null;
  status: AcceptanceStatus;
  reviewRemark?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  phase?: string | null;
  createdAt: Date;
}

export interface WorkerCheckin {
  id: string;
  projectId: string;
  workerId: string;
  checkinTime: Date;
  checkoutTime?: Date | null;
  location?: string | null;
  photoUrl?: string | null;
  remark?: string | null;
  workType?: string | null;
  createdAt: Date;
}

export interface AfterSalesTicket {
  id: string;
  ticketNo: string;
  projectId: string;
  title: string;
  description: string;
  status: AfterSalesStatus;
  priority: string;
  reporterId: string;
  assigneeId?: string | null;
  resolvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialDelay {
  id: string;
  changeOrderId?: string | null;
  projectId: string;
  materialName: string;
  specification?: string | null;
  quantity?: number | null;
  originalDate: Date;
  estimatedDate?: Date | null;
  actualDate?: Date | null;
  delayDays?: number | null;
  reason: string;
  status: MaterialDelayStatus;
  impact?: string | null;
  reportedById: string;
  handledById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
