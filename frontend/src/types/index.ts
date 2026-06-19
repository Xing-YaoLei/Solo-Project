export type RoleEnum = 'tourist' | 'ticket_clerk' | 'patrol' | 'operation' | 'admin';
export type RecordStatusEnum = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type ExceptionTypeEnum = 'performance_cancel' | 'route_change' | 'equipment_failure' | 'weather_issue' | 'staff_absence' | 'other';

export interface Pagination<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name: string;
  phone?: string;
  role: RoleEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuideRoute {
  id: number;
  name: string;
  code: string;
  description?: string;
  duration_minutes: number;
  distance_meters: number;
  cover_image?: string;
  status: RecordStatusEnum;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface HeatPoint {
  id: number;
  route_id: number;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  description?: string;
  sort_order: number;
  status: RecordStatusEnum;
  verified_at?: string;
  verified_by?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface GuideContent {
  id: number;
  route_id: number;
  title: string;
  content_type: string;
  content_text?: string;
  audio_url?: string;
  video_url?: string;
  language: string;
  sort_order: number;
  status: RecordStatusEnum;
  verified_at?: string;
  verified_by?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Performance {
  id: number;
  name: string;
  code: string;
  venue?: string;
  description?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface PerformanceSession {
  id: number;
  performance_id: number;
  start_time: string;
  end_time?: string;
  total_seats: number;
  status: RecordStatusEnum;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Seat {
  id: number;
  session_id: number;
  row: string;
  number: string;
  zone?: string;
  price: number;
  is_available: boolean;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: number;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  address?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface MerchantContract {
  id: number;
  merchant_id: number;
  contract_no: string;
  title: string;
  start_date: string;
  end_date?: string;
  amount: number;
  status: RecordStatusEnum;
  verified_at?: string;
  verified_by?: number;
  content?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface Ticket {
  id: number;
  ticket_no: string;
  route_id?: number;
  seat_id?: number;
  owner_id?: number;
  buyer_name?: string;
  buyer_phone?: string;
  ticket_type: string;
  price: number;
  sold_at?: string;
  sold_by?: number;
  used_at?: string;
  status: RecordStatusEnum;
  created_at: string;
  updated_at: string;
}

export interface SecondarySale {
  id: number;
  ticket_id: number;
  ticket_no?: string;
  item_name: string;
  item_category?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  salesperson_id?: number;
  sale_channel?: string;
  sold_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExceptionRecord {
  id: number;
  exception_type: ExceptionTypeEnum;
  related_type?: string;
  related_id?: number;
  title: string;
  description?: string;
  root_cause?: string;
  resolution?: string;
  status: RecordStatusEnum;
  original_record_type?: string;
  original_record_id?: number;
  occurred_at?: string;
  resolved_at?: string;
  handled_by?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  record_type?: string;
  record_id?: number;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  batch_ids?: number[];
  remarks?: string;
  ip_address?: string;
  created_at: string;
}

export interface TraceItem {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  field?: string;
  old?: string;
  new?: string;
  remarks?: string;
  at: string;
}

export interface DailyConversion {
  date: string;
  ticket_count: number;
  secondary_conversion_rate: number;
  secondary_per_ticket: number;
  total_revenue: number;
}

export interface TicketStatistics {
  date: string;
  total_tickets: number;
  total_revenue: number;
  used_tickets: number;
  utilization_rate: number;
}

export interface SecondarySaleStatistics {
  ticket_no: string;
  ticket_id: number;
  buyer_name?: string;
  route_name?: string;
  secondary_count: number;
  secondary_total: number;
  items: any[];
}

export const ROLE_LABELS: Record<RoleEnum, string> = {
  tourist: '游客',
  ticket_clerk: '票务员',
  patrol: '巡场员',
  operation: '运营',
  admin: '管理员',
};

export const STATUS_LABELS: Record<RecordStatusEnum, string> = {
  draft: '草稿',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
  completed: '已完成',
};

export const STATUS_COLORS: Record<RecordStatusEnum, string> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
  completed: 'processing',
};

export const EXCEPTION_LABELS: Record<ExceptionTypeEnum, string> = {
  performance_cancel: '演出取消',
  route_change: '路线变更',
  equipment_failure: '设备故障',
  weather_issue: '天气问题',
  staff_absence: '人员缺岗',
  other: '其他',
};
