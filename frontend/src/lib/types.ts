export type CleaningStatus =
  | 'draft'
  | 'pending_review'
  | 'supplement_info'
  | 'reviewing'
  | 'completed'
  | 'closed'

export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'unknown'

export type SourceChannel =
  | 'routine_inspection'
  | 'device_alert'
  | 'manual_report'
  | 'store_request'

export type CloseReason = 'qualified' | 'device_replaced' | 'point_closed' | 'other'

export interface StorePoint {
  id: number
  name: string
  address?: string
  store_code: string
  region?: string
  status: 'active' | 'inactive' | 'maintenance'
  contact_person?: string
  contact_phone?: string
  created_at?: string
  updated_at?: string
}

export interface Device {
  id: number
  device_code: string
  device_name: string
  device_type?: string
  store_point_id?: number
  status: DeviceStatus
  last_heartbeat?: string
  installation_date?: string
  last_maintenance_date?: string
  specifications?: Record<string, any>
  remarks?: string
  created_at?: string
  updated_at?: string
  store_point?: StorePoint
}

export interface Person {
  id: number
  name: string
  employee_id?: string
  role?: string
  phone?: string
  email?: string
  department?: string
  is_active: boolean
  created_at?: string
}

export interface CleaningItem {
  name: string
  completed: boolean
  remarks?: string
}

export interface StatusLog {
  id: number
  cleaning_record_id: number
  from_status?: CleaningStatus
  to_status: CleaningStatus
  operator_id?: number
  remarks?: string
  created_at: string
  operator?: Person
}

export interface CleaningRecord {
  id: number
  record_no: string
  store_point_id: number
  device_id: number
  source_channel: SourceChannel
  status: CleaningStatus

  cleaning_date?: string
  cleaning_person_id?: number
  cleaning_items: CleaningItem[]
  cleaning_photos: string[]
  cleaning_remarks?: string

  reviewer_id?: number
  review_date?: string
  review_result?: string
  review_remarks?: string
  review_photos: string[]

  inspection_result?: string
  qualified_rate?: number

  close_reason?: CloseReason
  close_remarks?: string
  closed_at?: string
  closed_by_id?: number

  is_device_offline: boolean
  offline_handled: boolean
  offline_remarks?: string

  supplement_notes?: string

  created_at: string
  updated_at?: string

  store_point: StorePoint
  device: Device
  cleaning_person?: Person
  reviewer?: Person
  closed_by?: Person
  status_logs: StatusLog[]
}

export interface CleaningRecordList {
  total: number
  items: CleaningRecord[]
}

export interface StatisticsSummary {
  total_records: number
  completed_count: number
  reviewing_count: number
  supplement_count: number
  closed_count: number
  avg_qualified_rate: number
}

export interface StatisticsByChannel {
  channel: string
  count: number
  qualified_rate: number
}

export interface StatisticsByPerson {
  person_id: number
  person_name: string
  total: number
  completed: number
  qualified_rate: number
}

export interface StatisticsByCloseReason {
  reason: string
  count: number
}
