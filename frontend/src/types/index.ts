export type UserRole = 'admin' | 'supervisor' | 'cleaner';

export type CleaningStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export type AttendanceStatus =
  | 'not_started'
  | 'en_route'
  | 'arrived'
  | 'checked_out';

export type RescheduleReason =
  | 'customer_request'
  | 'staff_unavailable'
  | 'conflict'
  | 'apartment_unavailable'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  skills: string[] | null;
  created_at: string;
}

export interface Apartment {
  id: number;
  apartment_code: string;
  building: string;
  unit: string;
  room_number: string | null;
  floor: number | null;
  area_sqm: number | null;
  apartment_type: string | null;
  resident_name: string | null;
  resident_phone: string | null;
  door_lock_info: string | null;
  special_instructions: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  is_peak: boolean;
  capacity: number;
  is_active: boolean;
}

export interface CleaningSchedule {
  id: number;
  schedule_code: string;
  apartment_id: number;
  cleaner_id: number | null;
  supervisor_id: number | null;
  created_by_id: number | null;
  scheduled_date: string;
  time_slot_id: number | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: CleaningStatus;
  attendance_status: AttendanceStatus;
  priority: number;
  cleaning_type: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  has_conflict: boolean;
  risk_level: RiskLevel | null;
  conflict_details: Record<string, any> | null;
  customer_notes: string | null;
  internal_notes: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  completion_time: string | null;
  quality_score: number | null;
  feedback: string | null;
  created_at: string;
  updated_at: string | null;
  apartment?: Apartment;
  cleaner?: User;
  supervisor?: User;
  time_slot?: TimeSlot;
}

export interface ConflictInfo {
  conflict_type: string;
  risk_level: RiskLevel;
  description: string;
  conflicting_schedule_id: number | null;
  details: Record<string, any>;
}

export interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicts: ConflictInfo[];
  capacity_warnings: string[];
}

export interface RescheduleRecord {
  id: number;
  cleaning_schedule_id: number;
  old_start_time: string;
  old_end_time: string;
  old_cleaner_id: number | null;
  new_start_time: string;
  new_end_time: string;
  new_cleaner_id: number | null;
  reason: RescheduleReason;
  reason_detail: string | null;
  requested_by: number | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  cleaning_schedule_id: number;
  status: AttendanceStatus;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  photo_url: string | null;
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
}

export interface ConflictRecord {
  id: number;
  cleaning_schedule_id: number;
  conflicting_schedule_id: number | null;
  conflict_type: string;
  risk_level: RiskLevel;
  description: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: number | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CommunicationRecord {
  id: number;
  cleaning_schedule_id: number;
  sender_id: number;
  message_type: string;
  content: string;
  attachments: string[] | null;
  is_internal: boolean;
  recipient: string | null;
  sender?: User;
  created_at: string;
}

export interface ReviewOpinion {
  id: number;
  cleaning_schedule_id: number;
  reviewer_id: number;
  review_type: string;
  opinion: string;
  decision: string | null;
  is_approved: boolean | null;
  reviewer?: User;
  created_at: string;
  updated_at: string | null;
}

export interface CapacityRule {
  id: number;
  rule_name: string;
  rule_type: string;
  apply_day_of_week: number[] | null;
  apply_date_start: string | null;
  apply_date_end: string | null;
  time_slot_id: number | null;
  max_cleanings: number;
  max_cleanings_per_staff: number | null;
  min_gap_minutes: number | null;
  priority: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface AttendanceTrendPoint {
  date: string;
  total_schedules: number;
  arrived: number;
  on_time: number;
  late: number;
  no_show: number;
  attendance_rate: number;
  on_time_rate: number;
}

export interface StaffPerformance {
  staff_id: number;
  staff_name: string;
  total_schedules: number;
  completed: number;
  attendance_rate: number;
  on_time_rate: number;
  avg_quality_score: number | null;
}

export interface DashboardStats {
  today_schedules: number;
  today_completed: number;
  today_in_progress: number;
  today_pending: number;
  conflicts_count: number;
  week_attendance_rate: number;
  month_attendance_rate: number;
  attendance_trend: AttendanceTrendPoint[];
  staff_performance: StaffPerformance[];
}

export interface TodoItem {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: number;
  due_time: string | null;
  schedule_id: number | null;
  created_at: string;
}
