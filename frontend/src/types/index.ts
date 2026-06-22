export enum UserRole {
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  HANDLER = 'handler',
  REVIEWER = 'reviewer',
}

export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REVIEWING = 'reviewing',
  REVIEW_FAILED = 'review_failed',
  CLOSED = 'closed',
}

export const OrderStatusText: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待派工',
  [OrderStatus.ASSIGNED]: '已派工',
  [OrderStatus.PROCESSING]: '处理中',
  [OrderStatus.COMPLETED]: '处理完成',
  [OrderStatus.REVIEWING]: '复核中',
  [OrderStatus.REVIEW_FAILED]: '复核不通过',
  [OrderStatus.CLOSED]: '已闭环',
};

export const OrderStatusColor: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'default',
  [OrderStatus.ASSIGNED]: 'blue',
  [OrderStatus.PROCESSING]: 'processing',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.REVIEWING]: 'warning',
  [OrderStatus.REVIEW_FAILED]: 'error',
  [OrderStatus.CLOSED]: 'success',
};

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
}

export interface DispatchRule {
  id: number;
  name: string;
  description?: string;
  department?: string;
  default_assignee_id?: number;
  default_assignee?: User;
  priority: number;
  handling_time_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Attachment {
  id: number;
  process_record_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

export interface ProcessRecord {
  id: number;
  order_id: number;
  handler_id: number;
  handler: User;
  action: string;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  remark?: string;
  attachments: Attachment[];
  created_at: string;
}

export interface AffectedObject {
  id: number;
  order_id: number;
  object_type: string;
  object_name: string;
  object_id?: string;
  description?: string;
  impact_level: string;
  created_at: string;
}

export interface ReviewSupplement {
  id: number;
  order_id: number;
  operator_id: number;
  operator: User;
  supplement_type: string;
  content?: string;
  old_assignee_id?: number;
  old_assignee?: User;
  new_assignee_id?: number;
  new_assignee?: User;
  created_at: string;
}

export interface Order {
  id: number;
  order_no: string;
  title: string;
  description?: string;
  status: OrderStatus;
  priority: number;
  audit_type?: string;
  audit_item?: string;
  location?: string;
  site_photo_url?: string;
  dispatch_rule_id?: number;
  dispatch_rule?: DispatchRule;
  assignee_id?: number;
  assignee?: User;
  creator_id: number;
  creator: User;
  deadline?: string;
  first_resolved: boolean;
  processing_count: number;
  process_records: ProcessRecord[];
  affected_objects: AffectedObject[];
  review_supplements: ReviewSupplement[];
  created_at: string;
  updated_at?: string;
}

export interface OrderListResponse {
  total: number;
  items: Order[];
  page: number;
  page_size: number;
}

export interface FirstTimeResolutionStats {
  total_orders: number;
  first_time_resolved: number;
  first_time_resolution_rate: number;
  by_auditor: Array<{
    username: string;
    full_name: string;
    total: number;
    first_time: number;
    rate: number;
  }>;
  by_department: Array<{
    department: string;
    total: number;
    first_time: number;
    rate: number;
  }>;
  by_month: Array<{
    month: string;
    total: number;
    first_time: number;
    rate: number;
  }>;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}
