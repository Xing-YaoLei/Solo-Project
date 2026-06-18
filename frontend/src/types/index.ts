export type StationStatus = 'idle' | 'occupied' | 'maintenance'
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'closed' | 'reworked'
export type PartShortageStatus = 'open' | 'processing' | 'closed'
export type UserRole = 'admin' | 'technician' | 'manager' | 'parts'

export interface User {
  id: number
  username: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Vehicle {
  id: number
  plate_number: string
  vin: string | null
  brand: string
  model: string
  year: number | null
  color: string | null
  mileage: string | null
  owner_name: string | null
  owner_phone: string | null
  created_at: string
  updated_at: string
}

export interface Station {
  id: number
  name: string
  type: string | null
  status: StationStatus
  current_work_order_id: number | null
  current_work_order?: WorkOrder | null
}

export interface Diagnostic {
  id: number
  work_order_id: number
  technician_id: number | null
  symptom: string | null
  fault_code: string | null
  analysis: string | null
  conclusion: string | null
  created_at: string
}

export interface WorkOrderItem {
  id: number
  work_order_id: number
  item_type: string
  name: string
  description: string | null
  quantity: string
  unit_price: string
  part_id: number | null
  status: string
}

export interface WorkOrder {
  id: number
  order_no: string
  vehicle_id: number
  station_id: number | null
  technician_id: number | null
  status: WorkOrderStatus
  complaint: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  actual_start: string | null
  actual_end: string | null
  is_rework: boolean
  parent_order_id: number | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle | null
  station?: Station | null
  technician?: User | null
  diagnostics?: Diagnostic[]
  items?: WorkOrderItem[]
}

export interface Part {
  id: number
  sku: string
  name: string
  brand: string | null
  specification: string | null
  unit: string
  safety_stock: number
  created_at: string
  stock?: PartStock | null
}

export interface PartStock {
  id: number
  part_id: number
  quantity: number
  location: string | null
  last_updated: string
}

export interface StockChangeLog {
  id: number
  part_id: number
  work_order_id: number | null
  before_quantity: number
  after_quantity: number
  change_reason: string | null
  operator_id: number | null
  created_at: string
  part?: Part | null
}

export interface PartShortage {
  id: number
  part_id: number
  work_order_id: number | null
  required_quantity: number
  status: PartShortageStatus
  reason: string | null
  action_taken: string | null
  handler_id: number | null
  reported_at: string
  closed_at: string | null
  part?: Part | null
  work_order?: WorkOrder | null
  handler?: User | null
}

export interface ReworkRateReport {
  month: string
  total_orders: number
  rework_orders: number
  rework_rate: number
  details: Array<{
    order_no: string
    plate_number: string
    brand_model: string
    complaint: string
    technician: string
    reason: string
    created_at: string
  }>
}
