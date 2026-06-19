export enum Role {
  ADMIN = 'ADMIN',
  OPERATION_MANAGER = 'OPERATION_MANAGER',
  TICKET_STAFF = 'TICKET_STAFF',
  FINANCE = 'FINANCE',
  SPONSOR_CONTACT = 'SPONSOR_CONTACT',
  PERFORMER = 'PERFORMER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  VERIFIED = 'VERIFIED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUND_APPROVED = 'REFUND_APPROVED',
  REFUND_REJECTED = 'REFUND_REJECTED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VERIFY = 'VERIFY',
  REFUND = 'REFUND',
  DISPUTE_OPEN = 'DISPUTE_OPEN',
  DISPUTE_RESOLVE = 'DISPUTE_RESOLVE',
  DISPUTE_CLOSE = 'DISPUTE_CLOSE',
  ASSIGN = 'ASSIGN',
  EXPORT = 'EXPORT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSchedule {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceTask {
  id: number;
  scheduleId: number;
  title: string;
  description?: string;
  type: string;
  priority: number;
  status: TaskStatus;
  assigneeId?: number;
  creatorId: number;
  startTime?: string;
  endTime?: string;
  dueTime?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  creator?: User;
}

export interface Sponsor {
  id: number;
  scheduleId: number;
  name: string;
  level: string;
  amount: number;
  contactName?: string;
  contactPhone?: string;
  benefits?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: number;
  scheduleId: number;
  name: string;
  price: number;
  totalCount: number;
  soldCount: number;
  description?: string;
  rules?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  scheduleId: number;
  ticketTypeId: number;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  creatorId: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  schedule?: PerformanceSchedule;
  ticketType?: TicketType;
}

export interface OrderChangeLog {
  id: number;
  orderId: number;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  operatorId?: number;
  remark?: string;
  createdAt: string;
}

export interface VerificationRecord {
  id: number;
  orderId: number;
  verifierId: number;
  verifyTime: string;
  quantity: number;
  verifyMethod: string;
  remark?: string;
  createdAt: string;
}

export interface RefundDispute {
  id: number;
  orderId: number;
  title: string;
  reason: string;
  status: DisputeStatus;
  initiatorId?: number;
  handlerId?: number;
  resolution?: string;
  closeTime?: string;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  handler?: User;
}

export interface DisputeLog {
  id: number;
  disputeId: number;
  action: LogAction;
  description: string;
  operatorId?: number;
  createdAt: string;
}

export interface SystemLog {
  id: number;
  action: LogAction;
  module: string;
  description: string;
  operatorId?: number;
  operatorName?: string;
  relatedId?: number;
  relatedType?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
}

export interface ExportRecord {
  id: number;
  filename: string;
  exportType: string;
  filterConditions: any;
  operatorId: number;
  recordCount: number;
  fileUrl?: string;
  createdAt: string;
}
