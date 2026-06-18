export interface UserInfo {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  role_display: string
  phone: string
  employee_id: string
  permissions: string[]
}

export type UserRole = 'appraiser' | 'sales' | 'finance' | 'manager'

export interface LoginResponse {
  access: string
  refresh: string
  user: UserInfo
}

export type VehicleStatus =
  | 'pending_evaluation'
  | 'pending_inspection'
  | 'pending_preparation'
  | 'pending_testdrive'
  | 'pending_review'
  | 'listed'
  | 'sold'
  | 'off_shelf'
  | 'rejected'

export type ReviewStatus = 'pending' | 'pass' | 'reject' | 'supplemented'

export type DocumentType =
  | 'registration_cert'
  | 'driving_license'
  | 'insurance'
  | 'maintenance_record'
  | 'keys'
  | 'invoice'
  | 'other'

export interface DocumentStatus {
  complete: boolean
  missing_count: number
  missing_types: DocumentType[]
}

export interface StageCompletion {
  total: number
  done: number
  percentage: number
  stages: {
    evaluation: boolean
    inspection: boolean
    preparation: boolean
    testdrive: boolean
  }
}

export interface VehicleListItem {
  id: number
  vin: string
  plate_number: string
  brand: string
  model: string
  year: number
  color: string
  mileage: number
  fuel_type: string
  status: VehicleStatus
  status_display: string
  review_status: ReviewStatus
  review_status_display: string
  purchase_price: number | null
  expected_price: number | null
  selling_price: number | null
  appraiser: number | null
  appraiser_info: SimpleUser | null
  salesperson: number | null
  salesperson_info: SimpleUser | null
  document_status: DocumentStatus
  stage_completion: StageCompletion
  inventory_days: number
  source: string
  created_at: string
  updated_at: string
  listed_at: string | null
  sold_at: string | null
}

export interface VehicleDetail extends VehicleListItem {
  displacement: string
  transmission: string
  first_register_date: string | null
  owner_name: string
  owner_phone: string
  description: string
  remark: string
  created_by: number | null
}

export interface SimpleUser {
  id: number
  username: string
  first_name: string
  last_name: string
  role_display: string
}

export interface ReviewRecord {
  id: number
  vehicle: number
  reviewer: number | null
  reviewer_info: SimpleUser | null
  status: ReviewStatus
  status_display: string
  comment: string
  missing_items: DocumentType[]
  conclusion: string
  created_at: string
}

export interface StatusChangeLog {
  id: number
  vehicle: number
  from_status: VehicleStatus
  from_status_display: string
  to_status: VehicleStatus
  to_status_display: string
  operator: number | null
  operator_info: SimpleUser | null
  remark: string
  created_at: string
}

export interface InspectionItem {
  id: number
  report: number
  item: string
  item_display: string
  rating: string
  rating_display: string
  description: string
  photos: string[]
  created_at: string
}

export interface InspectionReport {
  id: number
  vehicle: number
  report_no: string
  inspector: number | null
  inspector_info: SimpleUser | null
  status: string
  status_display: string
  mileage: number | null
  overall_rating: string
  overall_rating_display: string
  has_accident: boolean
  has_water_damage: boolean
  has_fire_damage: boolean
  has_structural_damage: boolean
  general_condition: string
  issues: string
  suggestions: string
  verified: boolean
  verified_by: number | null
  verified_at: string | null
  inspection_date: string
  items: InspectionItem[]
  items_summary: {
    total: number
    excellent: number
    good: number
    average: number
    poor: number
  }
}

export interface PreparationItem {
  id: number
  order: number
  category: string
  category_display: string
  name: string
  description: string
  estimated_cost: number
  actual_cost: number
  is_done: boolean
  done_at: string | null
  photos: string[]
}

export interface PreparationOrder {
  id: number
  vehicle: number
  order_no: string
  status: string
  status_display: string
  handler: number | null
  handler_info: SimpleUser | null
  estimated_cost: number
  actual_cost: number
  start_date: string | null
  end_date: string | null
  remark: string
  verified: boolean
  verified_by: number | null
  verified_at: string | null
  items: PreparationItem[]
  total_estimated: number
  total_actual: number
  done_count: number
  total_count: number
}

export interface TestDriveRecord {
  id: number
  vehicle: number
  record_no: string
  salesperson: number | null
  salesperson_info: SimpleUser | null
  customer_name: string
  customer_phone: string
  customer_id_card: string
  license_number: string
  status: string
  status_display: string
  scheduled_at: string
  start_mileage: number | null
  end_mileage: number | null
  start_time: string | null
  end_time: string | null
  route: string
  feedback: string
  brake_feeling: string
  shift_feeling: string
  ride_comfort: string
  noise_level: string
  handling: string
  abnormal_noise: string
  other_issues: string
  purchase_intent: string
  purchase_intent_display: string
  expected_price: number | null
  remark: string
  verified: boolean
  verified_by: number | null
  verified_at: string | null
  testdrive_distance: number | null
  testdrive_duration: number | null
}

export interface VehicleDocument {
  id: number
  vehicle: number
  document_type: DocumentType
  category: string
  category_display: string
  source: string
  source_display: string
  title: string
  description: string
  file_path: string
  file_name: string
  file_size: number
  file_size_display: string
  content_type: string
  file_url: string
  uploaded_by: number | null
  uploaded_by_info: SimpleUser | null
  is_verified: boolean
  verified_by: number | null
  verified_at: string | null
  verification_note: string
  expire_date: string | null
  process_history: ProcessLog[]
  close_conclusion: string
  is_closed: boolean
  closed_by: number | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface ProcessLog {
  action: string
  operator: string
  operator_id: number | null
  note: string
  timestamp: string
}

export interface OverviewStats {
  total_vehicles: number
  listed_vehicles: number
  sold_vehicles: number
  pending_review: number
  vehicles_with_missing_docs: number
  total_cost: number
  total_revenue: number
  profit: number
  profit_margin: number
  avg_inventory_days: number
  sold_this_month: number
  listed_this_month: number
  created_today: number
}

export interface InventoryTurnoverItem {
  id: number
  vin: string
  brand: string
  model: string
  year: number
  plate_number: string
  purchase_price: number
  selling_price: number
  profit: number
  profit_rate: number
  inventory_days: number
  created_at: string
  sold_at: string
  salesperson: string
}

export interface InventoryTurnover {
  period_days: number
  total_sold: number
  total_cost: number
  total_profit: number
  avg_profit: number
  avg_inventory_days: number
  median_inventory_days: number
  fastest_days: number
  slowest_days: number
  details: InventoryTurnoverItem[]
}

export interface TimelineEvent {
  type: 'create' | 'status' | 'inspection' | 'preparation' | 'testdrive' | 'review' | 'document'
  time: string
  time_display: string
  title: string
  operator: string
  detail: string
}

export interface VehicleTrace {
  vehicle: {
    id: number
    vin: string
    brand: string
    model: string
    year: number
    status: string
    status_display: string
    review_status: string
    review_status_display: string
  }
  timeline: TimelineEvent[]
  documents_count: number
  review_records_count: number
}
