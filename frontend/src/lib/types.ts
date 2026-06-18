export type UserRole = 'consultant' | 'technician' | 'parts_staff' | 'manager';

export interface User {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'waiting_parts'
  | 'in_inspection'
  | 'completed'
  | 'closed'
  | 'rework';

export type OrderPriority = 'normal' | 'urgent' | 'critical';

export interface WorkOrder {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone?: string;
  vehicle_plate: string;
  vehicle_model?: string;
  vin?: string;
  status: OrderStatus;
  priority: OrderPriority;
  assigned_consultant_id?: string;
  assigned_technician_id?: string;
  estimated_completion?: string;
  actual_completion?: string;
  mileage_in?: number;
  mileage_out?: number;
  customer_complaint?: string;
  diagnosis?: string;
  repair_notes?: string;
  total_amount: number;
  is_rework: boolean;
  original_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderCreate {
  customer_name: string;
  customer_phone?: string;
  vehicle_plate: string;
  vehicle_model?: string;
  vin?: string;
  priority?: OrderPriority;
  assigned_consultant_id?: string;
  assigned_technician_id?: string;
  estimated_completion?: string;
  mileage_in?: number;
  customer_complaint?: string;
}

export type PartStatus = 'pending' | 'issued' | 'returned';

export interface Part {
  id: string;
  part_no: string;
  name: string;
  category?: string;
  unit?: string;
  stock_quantity: number;
  min_stock: number;
  unit_price: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface PartCreate {
  part_no: string;
  name: string;
  category?: string;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  unit_price: number;
  location?: string;
}

export interface OrderPart {
  id: string;
  work_order_id: string;
  part_id: string;
  part_name?: string;
  quantity: number;
  unit_price: number;
  status: PartStatus;
  issued_by?: string;
  issued_at?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';
export type ItemType = 'labor' | 'part' | 'other';

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Quote {
  id: string;
  quote_no: string;
  work_order_id: string;
  status: QuoteStatus;
  total_amount: number;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: QuoteItem[];
}

export interface QuoteCreate {
  work_order_id: string;
  items: Omit<QuoteItem, 'id' | 'quote_id' | 'amount'>[];
  notes?: string;
}

export type InspectionType = 'pre_inspection' | 'in_progress' | 'final';
export type InspectionResult = 'pass' | 'fail' | 'conditional';

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  photo_url: string;
  description?: string;
  created_at: string;
}

export interface Inspection {
  id: string;
  work_order_id: string;
  inspector_id?: string;
  type: InspectionType;
  result: InspectionResult;
  notes?: string;
  photos?: InspectionPhoto[];
  created_at: string;
}

export interface InspectionCreate {
  work_order_id: string;
  type: InspectionType;
  result: InspectionResult;
  notes?: string;
  photo_urls?: string[];
}

export type ShortageStatus = 'pending' | 'procuring' | 'arrived' | 'substituted' | 'cancelled';

export interface Shortage {
  id: string;
  work_order_id: string;
  part_id?: string;
  part_name: string;
  requested_quantity: number;
  available_quantity: number;
  status: ShortageStatus;
  expected_arrival?: string;
  actual_arrival?: string;
  substitute_part_id?: string;
  handled_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShortageCreate {
  work_order_id: string;
  part_id?: string;
  part_name: string;
  requested_quantity: number;
  available_quantity?: number;
  expected_arrival?: string;
}

export interface ShortageUpdate {
  status?: ShortageStatus;
  expected_arrival?: string;
  actual_arrival?: string;
  substitute_part_id?: string;
  handled_by?: string;
  resolution_notes?: string;
}

export interface DashboardStats {
  active_orders: number;
  pending_shortages: number;
  today_appointments: number;
  pending_quotes: number;
  completed_today: number;
  rework_rate: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface StatisticsOverview {
  total_orders: number;
  active_orders: number;
  completed_this_month: number;
  rework_rate: number;
  avg_completion_hours: number;
  pending_shortages: number;
}

export interface ReworkRateByPeriod {
  period: string;
  total_orders: number;
  rework_orders: number;
  rework_rate: number;
}

export interface ReworkTraceItem {
  original_order_id: string;
  original_order_no: string;
  rework_order_id: string;
  rework_order_no: string;
  reason: string;
  created_at: string;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
}

export interface TechnicianPerformance {
  technician_id: string;
  technician_name: string;
  completed_orders: number;
  avg_completion_hours: number;
  rework_count: number;
}

export interface PartsUsage {
  part_id: string;
  part_name: string;
  part_no: string;
  total_used: number;
  total_amount: number;
}
