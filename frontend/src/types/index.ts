export interface BaseEntity {
  id?: number
  created_at?: string
  updated_at?: string
}

export interface Product extends BaseEntity {
  sku: string
  name: string
  category?: string
  unit?: string
  price?: number
  cost?: number
  supplier?: string
  description?: string
  image_url?: string
}

export interface GroupBatch extends BaseEntity {
  batch_no: string
  name: string
  status: string
  group_start_time?: string
  group_end_time?: string
  expected_arrival_time?: string
  actual_arrival_time?: string
  pickup_deadline?: string
  total_orders?: number
  total_items?: number
  total_amount?: number
  pickup_point?: string
  contact_person?: string
  contact_phone?: string
  remark?: string
  operator?: string
  arrival_lists?: ArrivalList[]
  pickup_codes?: PickupCode[]
  exception_orders?: ExceptionOrder[]
  status_logs?: StatusLog[]
}

export interface ArrivalList extends BaseEntity {
  group_batch_id: number
  product_id: number
  product_sku?: string
  product_name?: string
  expected_quantity?: number
  actual_quantity?: number
  shortage_quantity?: number
  unit_price?: number
  total_amount?: number
  status: string
  arrival_time?: string
  warehouse_operator?: string
  remark?: string
  has_exception?: number
  product_tags?: ProductTag[]
}

export interface PickupCode extends BaseEntity {
  group_batch_id: number
  code: string
  qr_code?: string
  customer_name?: string
  customer_phone?: string
  order_no?: string
  product_info?: string
  total_items?: number
  total_amount?: number
  status: string
  pickup_time?: string
  pickup_operator?: string
  expire_time?: string
  remark?: string
  is_notified?: boolean
  after_sale_vouchers?: AfterSaleVoucher[]
}

export interface AfterSaleVoucher extends BaseEntity {
  pickup_code_id: number
  voucher_no: string
  type: string
  reason?: string
  product_info?: string
  refund_amount?: number
  status: string
  applicant?: string
  applicant_phone?: string
  apply_time?: string
  processor?: string
  process_time?: string
  process_result?: string
  evidence_images?: string
  remark?: string
}

export interface ProductTag extends BaseEntity {
  arrival_list_id: number
  tag_type?: string
  tag_name?: string
  tag_color?: string
  description?: string
  operator?: string
}

export interface ExceptionOrder extends BaseEntity {
  group_batch_id: number
  arrival_list_id?: number
  exception_no: string
  type: string
  title?: string
  description?: string
  product_info?: string
  affected_quantity?: number
  affected_customers?: number
  estimated_loss?: number
  responsibility_party: string
  responsibility_detail?: string
  status: string
  reported_by?: string
  reported_time?: string
  processor?: string
  process_result?: string
  process_time?: string
  compensation_amount?: number
  evidence_images?: string
  remark?: string
}

export interface StatusLog extends BaseEntity {
  related_type: string
  related_id: number
  old_status?: string
  new_status: string
  change_reason?: string
  operator?: string
  operation_time?: string
  extra_info?: string
}

export interface DeliveryPerformance {
  summary: {
    total_batches: number
    on_time_batches: number
    delayed_batches: number
    on_time_rate: number
    avg_delay_hours: number
    total_expected_qty: number
    total_actual_qty: number
    total_shortage_qty: number
    shortage_rate: number
    total_exceptions: number
    closed_exceptions: number
    exception_resolve_rate: number
  }
  caliber: string
  period: {
    start_date?: string
    end_date?: string
  }
}

export interface TrendData {
  date: string
  total: number
  on_time: number
  rate: number
}

export const GroupBatchStatusMap: Record<string, string> = {
  pending: '待开团',
  in_progress: '开团中',
  arrived: '已到货',
  picking: '提货中',
  completed: '已完成',
  cancelled: '已取消',
}

export const ArrivalListStatusMap: Record<string, string> = {
  pending: '待到货',
  partial: '部分到货',
  completed: '已到货',
  shortage: '到货短少',
}

export const PickupCodeStatusMap: Record<string, string> = {
  unused: '待提货',
  used: '已提货',
  expired: '已过期',
  refunded: '已退款',
}

export const AfterSaleVoucherTypeMap: Record<string, string> = {
  refund: '退款',
  exchange: '换货',
  compensation: '赔偿',
  other: '其他',
}

export const AfterSaleVoucherStatusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  rejected: '已驳回',
}

export const ProductTagTypeMap: Record<string, string> = {
  quality: '品质异常',
  fresh: '新鲜度',
  cold: '冷链',
  fragile: '易碎',
  special: '特殊商品',
  other: '其他',
}

export const ExceptionOrderTypeMap: Record<string, string> = {
  shortage: '到货短少',
  quality: '质量问题',
  damage: '破损',
  delay: '配送延迟',
  other: '其他',
}

export const ExceptionOrderStatusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已处理',
  closed: '已结案',
}

export const ResponsibilityPartyMap: Record<string, string> = {
  supplier: '供应商',
  warehouse: '仓库',
  logistics: '物流',
  platform: '平台',
  customer: '客户',
  unknown: '待确认',
}

export const StatusColorMap: Record<string, string> = {
  pending: 'default',
  in_progress: 'processing',
  arrived: 'success',
  picking: 'blue',
  completed: 'green',
  cancelled: 'red',
  unused: 'default',
  used: 'success',
  expired: 'default',
  refunded: 'orange',
  partial: 'blue',
  shortage: 'red',
  processing: 'processing',
  rejected: 'red',
  closed: 'green',
}
