export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'rescheduled' | 'conflict'

export type TimelineEventType =
  | 'created'
  | 'status_changed'
  | 'note_added'
  | 'attachment_added'
  | 'rescheduled'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'handover'
  | 'remark'

export type ConflictStatus = 'detected' | 'assigned' | 'in_progress' | 'resolved' | 'closed'

export type UserRole = 'admin' | 'operator' | 'supervisor' | 'viewer'

export interface User {
  id: number
  username: string
  email?: string
  full_name?: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface TimeSlot {
  id: number
  date: string
  start_time: string
  end_time: string
  capacity: number
  remaining_capacity: number
  is_active: boolean
  description?: string
  created_at: string
  updated_at?: string
}

export interface CapacityRule {
  id: number
  time_slot_id: number
  rule_type: string
  rule_value: Record<string, any>
  priority: number
  is_active: boolean
  description?: string
  created_at: string
  updated_at?: string
}

export interface Reservation {
  id: number
  reservation_no: string
  time_slot_id: number
  time_slot?: TimeSlot
  visitor_name: string
  visitor_phone: string
  visitor_count: number
  ticket_type?: string
  status: ReservationStatus
  check_in_time?: string
  source?: string
  remark?: string
  created_at: string
  updated_at?: string
}

export interface ReservationListResponse {
  items: Reservation[]
  total: number
  page: number
  page_size: number
}

export interface RescheduleRecord {
  id: number
  original_reservation_id: number
  new_reservation_id?: number
  original_time_slot_id: number
  new_time_slot_id?: number
  reason?: string
  operator_id?: number
  reschedule_time: string
  status: string
}

export interface Attachment {
  id: number
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  uploaded_at: string
}

export interface TimelineRecord {
  id: number
  reservation_id: number
  event_type: TimelineEventType
  description?: string
  operator_id?: number
  operator?: User
  metadata?: Record<string, any>
  attachments: Attachment[]
  created_at: string
}

export interface ConflictAffectedObject {
  id: number
  conflict_id: number
  reservation_id: number
  reservation?: Reservation
  impact_type?: string
  impact_description?: string
}

export interface ConflictRecord {
  id: number
  conflict_no: string
  time_slot_id: int
  conflict_type: string
  description?: string
  status: ConflictStatus
  severity: string
  assigned_to?: number
  assignee?: User
  resolution?: string
  detected_at: string
  resolved_at?: string
  affected_objects: ConflictAffectedObject[]
}

export interface ConflictListResponse {
  items: ConflictRecord[]
  total: number
  page: number
  page_size: number
}

export interface AttendanceStats {
  date: string
  total_reservations: number
  total_visitors: number
  checked_in: number
  check_in_rate: number
  cancelled: number
  pending: number
}

export interface StatsSummary {
  today: {
    reservations: number
    visitors: number
    checked_in: number
    check_in_rate: number
  }
  pending_conflicts: number
  active_time_slots: number
}
