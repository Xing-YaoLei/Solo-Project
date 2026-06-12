export interface Store {
  id: number;
  store_code: string;
  store_name: string;
  city?: string;
  district?: string;
  address?: string;
  status: string;
}

export interface StoreWithStats extends Store {
  equipment_count: number;
  normal_count: number;
  offline_count: number;
  maintenance_count: number;
  cleaning_count: number;
  pass_rate: number;
}

export interface Equipment {
  id: number;
  equipment_code: string;
  equipment_name: string;
  equipment_type: string;
  store_id: number;
  brand?: string;
  model?: string;
  install_date?: string;
  status: string;
  last_cleaning_date?: string;
  next_cleaning_date?: string;
  cleaning_cycle_days: number;
}

export interface OfflineEquipment extends Equipment {
  store_code?: string;
  store_name?: string;
  city?: string;
  district?: string;
  days_since_clean: number;
  is_warning?: boolean;
  remarks?: EquipmentRemark[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface EquipmentStatusItem {
  status: string;
  count: number;
  percentage: number;
}

export interface InspectionPassRate {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  avg_score: number;
}

export interface ThresholdConfig {
  id: number;
  config_key: string;
  config_name: string;
  config_value: number;
  config_unit?: string;
  description?: string;
  category?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentRemark {
  id: number;
  equipment_id: number;
  store_id: number;
  remark_type: string;
  content: string;
  operator?: string;
  related_date?: string;
  created_at: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface FailedInspection {
  id: number;
  record_code: string;
  equipment_id: number;
  equipment_code: string;
  equipment_name: string;
  store_id: number;
  store_code: string;
  store_name: string;
  city?: string;
  inspection_date: string;
  inspector?: string;
  inspection_type?: string;
  score: number;
  issues_found?: string;
  improvement_suggestions?: string;
}

export interface ProblematicStore {
  store_id: number;
  store_code: string;
  store_name: string;
  city?: string;
  inspection_total: number;
  inspection_passed: number;
  pass_rate: number;
  below_threshold: boolean;
}

export interface ReviewMaterial {
  generated_at: string;
  period: { start_date?: string; end_date?: string };
  thresholds_used: Record<string, number>;
  summary: string[];
  overall_metrics: InspectionPassRate;
  funnel: FunnelStage[];
  equipment_status_distribution: EquipmentStatusItem[];
  offline_equipments: OfflineEquipment[];
  failed_inspections: FailedInspection[];
  problematic_stores: ProblematicStore[];
  review_conclusion: string;
}

