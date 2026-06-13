export enum RoleEnum {
  WAREHOUSE = 'warehouse',
  DRIVER = 'driver',
  QC = 'qc',
  PURCHASER = 'purchaser',
  ADMIN = 'admin',
}

export enum ReplenishmentStatus {
  DRAFT = 'draft',
  PENDING_LOAD = 'pending_load',
  LOADED = 'loaded',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  QC_PENDING = 'qc_pending',
  QC_DONE = 'qc_done',
  DISCREPANCY = 'discrepancy',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TemperatureAlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum DiscrepancyType {
  QUANTITY_SHORT = 'quantity_short',
  QUANTITY_OVER = 'quantity_over',
  QUALITY_ISSUE = 'quality_issue',
  WRONG_ITEM = 'wrong_item',
  TEMPERATURE_ISSUE = 'temperature_issue',
  OTHER = 'other',
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: RoleEnum;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string;
  unit: string;
  min_temp: number;
  max_temp: number;
  is_active: boolean;
}

export interface ReplenishmentItem {
  id: number;
  product_id: number;
  product?: Product;
  planned_qty: number;
  loaded_qty: number;
  received_qty: number;
  unit_price?: number;
  remark?: string;
}

export interface BatchCode {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  batch_no: string;
  qty: number;
  production_date?: string;
  expiry_date?: string;
  verified: boolean;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
}

export interface QCImage {
  id: number;
  qc_record_id: number;
  file_path: string;
  file_name?: string;
  file_size?: number;
  created_at: string;
}

export interface QCRecord {
  id: number;
  order_id: number;
  product_id: number;
  batch_code_id?: number;
  checked_by: number;
  checked_at: string;
  temperature?: number;
  appearance_ok: boolean;
  packaging_ok: boolean;
  temperature_ok: boolean;
  passed: boolean;
  remark?: string;
  images: QCImage[];
}

export interface Discrepancy {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  type: DiscrepancyType;
  expected_qty?: number;
  actual_qty?: number;
  diff_qty?: number;
  description?: string;
  reported_by: number;
  reported_at: string;
  resolved: boolean;
  resolved_by?: number;
  resolved_at?: string;
  resolution_note?: string;
}

export interface TemperatureRecord {
  id: number;
  order_id: number;
  temperature: number;
  recorded_at: string;
  min_temp?: number;
  max_temp?: number;
  is_out_of_range: boolean;
  location?: string;
  device_id?: string;
}

export interface AlertHistory {
  id: number;
  alert_id: number;
  from_status?: TemperatureAlertStatus;
  to_status: TemperatureAlertStatus;
  action: string;
  note?: string;
  operator_id?: number;
  operator?: User;
  created_at: string;
}

export interface TemperatureAlert {
  id: number;
  order_id: number;
  trigger_record_id?: number;
  status: TemperatureAlertStatus;
  alert_type: string;
  severity: string;
  min_temp?: number;
  max_temp?: number;
  actual_temp?: number;
  duration_minutes: number;
  source_type: string;
  source_ref?: string;
  description?: string;
  acknowledged_at?: string;
  handled_by?: number;
  handled_at?: string;
  resolution?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  history: AlertHistory[];
  trigger_record?: TemperatureRecord;
  handler?: User;
}

export interface Attachment {
  id: number;
  order_id: number;
  file_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  category?: string;
  uploaded_by?: number;
  uploaded_at: string;
}

export interface ActionLog {
  id: number;
  order_id: number;
  user_id: number;
  user?: User;
  action: string;
  detail?: Record<string, any>;
  created_at: string;
}

export interface ReplenishmentOrder {
  id: number;
  order_no: string;
  store_id: number;
  store?: Store;
  status: ReplenishmentStatus;
  planned_date: string;
  truck_no?: string;
  driver_name?: string;
  driver_phone?: string;
  loading_list_no?: string;
  loading_time?: string;
  departure_time?: string;
  arrival_time?: string;
  remark?: string;
  created_by: number;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  items: ReplenishmentItem[];
  batches: BatchCode[];
  qc_records: QCRecord[];
  discrepancies: Discrepancy[];
  temperature_records: TemperatureRecord[];
  alerts: TemperatureAlert[];
  attachments: Attachment[];
  logs: ActionLog[];
}

export interface ReplenishmentOrderListItem {
  id: number;
  order_no: string;
  store_id: number;
  store_name?: string;
  status: ReplenishmentStatus;
  planned_date: string;
  truck_no?: string;
  driver_name?: string;
  loading_list_no?: string;
  created_at: string;
  updated_at: string;
  has_alerts: boolean;
  has_discrepancies: boolean;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface StatsTemperatureRate {
  date: string;
  total_orders: number;
  qualified_orders: number;
  rate: number;
}

export interface StatsTemperatureDrillDown {
  order_id: number;
  order_no: string;
  store_name: string;
  max_temp?: number;
  min_temp?: number;
  alert_count: number;
  status: ReplenishmentStatus;
}

export const ROLE_LABEL: Record<RoleEnum, string> = {
  [RoleEnum.WAREHOUSE]: '仓管',
  [RoleEnum.DRIVER]: '司机',
  [RoleEnum.QC]: '品控',
  [RoleEnum.PURCHASER]: '采购',
  [RoleEnum.ADMIN]: '管理员',
};

export const STATUS_LABEL: Record<ReplenishmentStatus, string> = {
  [ReplenishmentStatus.DRAFT]: '草稿',
  [ReplenishmentStatus.PENDING_LOAD]: '待装车',
  [ReplenishmentStatus.LOADED]: '已装车',
  [ReplenishmentStatus.IN_TRANSIT]: '运输中',
  [ReplenishmentStatus.ARRIVED]: '已到货',
  [ReplenishmentStatus.QC_PENDING]: '待质检',
  [ReplenishmentStatus.QC_DONE]: '质检完成',
  [ReplenishmentStatus.DISCREPANCY]: '存在差异',
  [ReplenishmentStatus.COMPLETED]: '已完成',
  [ReplenishmentStatus.CANCELLED]: '已取消',
};

export const STATUS_COLOR: Record<ReplenishmentStatus, string> = {
  [ReplenishmentStatus.DRAFT]: 'bg-slate-100 text-slate-700',
  [ReplenishmentStatus.PENDING_LOAD]: 'bg-yellow-100 text-yellow-800',
  [ReplenishmentStatus.LOADED]: 'bg-blue-100 text-blue-800',
  [ReplenishmentStatus.IN_TRANSIT]: 'bg-indigo-100 text-indigo-800',
  [ReplenishmentStatus.ARRIVED]: 'bg-cyan-100 text-cyan-800',
  [ReplenishmentStatus.QC_PENDING]: 'bg-orange-100 text-orange-800',
  [ReplenishmentStatus.QC_DONE]: 'bg-emerald-100 text-emerald-800',
  [ReplenishmentStatus.DISCREPANCY]: 'bg-red-100 text-red-800',
  [ReplenishmentStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ReplenishmentStatus.CANCELLED]: 'bg-gray-100 text-gray-600',
};

export const ALERT_STATUS_LABEL: Record<TemperatureAlertStatus, string> = {
  [TemperatureAlertStatus.OPEN]: '待处理',
  [TemperatureAlertStatus.ACKNOWLEDGED]: '已确认',
  [TemperatureAlertStatus.PROCESSING]: '处理中',
  [TemperatureAlertStatus.RESOLVED]: '已解决',
  [TemperatureAlertStatus.CLOSED]: '已关闭',
};

export const ALERT_STATUS_COLOR: Record<TemperatureAlertStatus, string> = {
  [TemperatureAlertStatus.OPEN]: 'bg-red-100 text-red-800',
  [TemperatureAlertStatus.ACKNOWLEDGED]: 'bg-yellow-100 text-yellow-800',
  [TemperatureAlertStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [TemperatureAlertStatus.RESOLVED]: 'bg-emerald-100 text-emerald-800',
  [TemperatureAlertStatus.CLOSED]: 'bg-gray-100 text-gray-600',
};

export const DISCREPANCY_TYPE_LABEL: Record<DiscrepancyType, string> = {
  [DiscrepancyType.QUANTITY_SHORT]: '数量短缺',
  [DiscrepancyType.QUANTITY_OVER]: '数量多发',
  [DiscrepancyType.QUALITY_ISSUE]: '质量问题',
  [DiscrepancyType.WRONG_ITEM]: '错发货物',
  [DiscrepancyType.TEMPERATURE_ISSUE]: '温度问题',
  [DiscrepancyType.OTHER]: '其他',
};

export const SEVERITY_LABEL: Record<string, string> = {
  warning: '警告',
  critical: '严重',
};

export const SEVERITY_COLOR: Record<string, string> = {
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
};
