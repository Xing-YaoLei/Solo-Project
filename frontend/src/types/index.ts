export type UserRole = 'admin' | 'manager' | 'worker';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  department?: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export type WorkOrderStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'reviewing'
  | 'review_failed'
  | 'closed';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkOrderCategory =
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'civil'
  | 'cleaning'
  | 'security'
  | 'other';

export interface WorkOrderPhoto {
  id: number;
  work_order_id: number;
  url: string;
  caption?: string;
  photo_type?: string;
  uploaded_by?: number;
  created_at: string;
}

export interface StatusLog {
  id: number;
  work_order_id: number;
  from_status?: WorkOrderStatus;
  to_status: WorkOrderStatus;
  remark?: string;
  operated_by?: number;
  created_at: string;
}

export interface ReviewRecord {
  id: number;
  work_order_id: number;
  reviewer_id: number;
  reviewer_name?: string;
  is_passed: boolean;
  comment?: string;
  review_time: string;
}

export interface Communication {
  id: number;
  work_order_id: number;
  sender_id: number;
  sender_name?: string;
  content: string;
  msg_type: string;
  created_at: string;
}

export interface DispatchRule {
  id: number;
  name: string;
  category?: WorkOrderCategory;
  priority?: WorkOrderPriority;
  assigned_role?: string;
  default_assignee_id?: number;
  processing_hours: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkOrder {
  id: number;
  order_no: string;
  title: string;
  description: string;
  location: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  reporter_name?: string;
  reporter_phone?: string;
  created_by?: number;
  assigned_to?: number;
  assigned_worker_name?: string;
  creator_name?: string;
  deadline?: string;
  processing_hours: number;
  is_first_time_resolved: boolean;
  review_failed_count: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  closed_at?: string;
  photos: WorkOrderPhoto[];
  status_logs: StatusLog[];
  review_records: ReviewRecord[];
  communications: Communication[];
  dispatch_rules: DispatchRule[];
}

export interface WorkOrderDailyItem {
  id: number;
  order_no: string;
  title: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: WorkOrderCategory;
  location: string;
  assigned_worker_name?: string;
  deadline?: string;
  is_overdue: boolean;
  review_failed: boolean;
  created_at: string;
}

export interface WorkOrderListResponse {
  items: WorkOrder[];
  total: number;
  page: number;
  page_size: number;
}

export interface DailyWorkOrdersResponse {
  items: WorkOrderDailyItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface FirstTimeResolveStats {
  date: string;
  total: number;
  first_time_resolved: number;
  rate: number;
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  review_failed_orders: number;
  first_time_resolve_rate: number;
  first_time_resolve_trend: FirstTimeResolveStats[];
}

export interface WorkOrderCreate {
  title: string;
  description: string;
  location: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  reporter_name?: string;
  reporter_phone?: string;
  photos?: Array<{ url: string; caption?: string; photo_type?: string }>;
}

export interface WorkOrderAssign {
  assigned_to: number;
  remark?: string;
}

export interface WorkOrderComplete {
  remark?: string;
  photos?: Array<{ url: string; caption?: string }>;
}

export interface WorkOrderReview {
  is_passed: boolean;
  comment?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}
