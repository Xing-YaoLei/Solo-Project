export interface DashboardKPI {
  total_vehicles: number
  transfer_completion_rate: number
  avg_turnover_days: number
  material_missing_rate: number
  kpi_trends: KPITrend[]
}

export interface KPITrend {
  date: string
  turnover_days: number
  completion_rate: number
  missing_rate: number
}

export interface StoreMapPoint {
  store_id: string
  store_name: string
  lng: number
  lat: number
  vehicle_count: number
  turnover_status: "normal" | "warning" | "critical"
}

export interface TurnoverTrend {
  month: string
  current: number
  yoy: number
  mom: number
  target: number
}

export interface MaterialHeatmap {
  material_type: string
  store_name: string
  missing_count: number
  missing_rate: number
  samples: MaterialSample[]
}

export interface MaterialSample {
  vehicle_id: string
  vin: string
  model: string
  missing_items: string[]
}

export interface VehicleListItem {
  vehicle_id: string
  vin: string
  model: string
  brand: string
  store_name: string
  entry_date: string
  status: "in_stock" | "transfer_processing" | "transferred" | "sold"
  turnover_days: number
}

export interface VehicleDetail {
  vehicle_id: string
  vin: string
  model: string
  brand: string
  year: number
  mileage: number
  store_id: string
  store_name: string
  entry_date: string
  status: string
  source_db_version: string
  detector_version: string
  crm_id: string
  inspection_reports: InspectionReport[]
  preparation_list: PreparationItem[]
  test_drive_records: TestDriveRecord[]
}

export interface InspectionReport {
  report_id: string
  inspector: string
  inspect_date: string
  detector_version: string
  items: InspectionItem[]
}

export interface InspectionItem {
  item_name: string
  status: "pass" | "fail" | "warning"
  detail: string
}

export interface PreparationItem {
  task_id: string
  task_name: string
  category: string
  status: "pending" | "in_progress" | "completed"
  related_inspection_item: string
  cost: number
}

export interface TestDriveRecord {
  record_id: string
  drive_date: string
  driver: string
  duration_minutes: number
  mileage_km: number
  is_anomaly: boolean
  anomaly_detail: string | null
}

export interface DiffSummary {
  source_vs_crm: { total: number; resolved: number; pending: number }
  detector_version_diff: { total: number; versions: VersionEntry[] }
}

export interface VersionEntry {
  version: string
  count: number
  change_date: string
  affected_stores: string[]
}

export interface DiffRecord {
  diff_id: string
  vehicle_id: string
  vin: string
  field_name: string
  source_value: string
  crm_value: string
  source: "vehicle_source" | "detector" | "crm"
  detected_at: string
  resolved: boolean
}

export interface TurnoverComparison {
  period: string
  current_value: number
  yoy_value: number
  mom_value: number
  target_value: number
  gap_to_target: number
}

export interface TurnoverGapSample {
  vehicle_id: string
  vin: string
  model: string
  store_name: string
  turnover_days: number
  gap_reason: string
  test_drive_anomaly: TestDriveRecord | null
}

export interface MaterialTrendPoint {
  month: string
  登记证: number
  行驶证: number
  购车发票: number
  保险单: number
  完税证明: number
}
