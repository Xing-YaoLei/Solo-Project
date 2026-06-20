export type VerificationStatus =
  | 'pending'
  | 'in_progress'
  | 'disputed'
  | 'supplementing'
  | 'escalated'
  | 'closed_normal'
  | 'closed_dispute'

export type ConclusionType = 'closed_normal' | 'closed_dispute'

export type SourceType = 'online' | 'offline' | 'import' | 'manual'

export type SeatStatus = 'available' | 'reserved' | 'occupied' | 'disabled'

export type EventStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'

export interface Event {
  id: string
  name: string
  venue: string
  event_date: string
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  price: number
  quota: number
  sold_count: number
  rules: Record<string, unknown> | null
  status: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  event_id: string
  ticket_type_id: string
  order_no: string
  buyer_name: string
  buyer_phone: string
  buyer_email?: string | null
  quantity: number
  total_amount: number
  status: string
  source: string | null
  source_reference: string | null
  created_at: string
  updated_at: string
}

export interface Seat {
  id: string
  event_id: string
  section: string
  row: string
  number: string
  seat_label: string
  status: SeatStatus
  order_id?: string | null
  ticket_type_id?: string | null
  created_at: string
  updated_at: string
}

export interface SeatingChart {
  event_id: string
  chart: Record<string, Record<string, SeatChartItem[]>>
}

export interface SeatChartItem {
  id: string
  number: string
  seat_label: string
  status: SeatStatus
  order_id: string | null
  ticket_type_id: string | null
}

export interface SeatInfo {
  number: string
  status: SeatStatus
  seat_id?: string
  order_id?: string | null
}

export interface VerificationTicket {
  id: string
  ticket_no: string
  event_id: string
  order_id: string
  seat_id: string | null
  ticket_type_id: string
  status: VerificationStatus
  assignee: string | null
  source: string | null
  source_reference: string | null
  verification_code: string | null
  verified_at: string | null
  closed_at: string | null
  conclusion: string | null
  dispute_reason: string | null
  supplement_note: string | null
  escalation_target: string | null
  created_at: string
  updated_at: string
  event?: Event
  ticket_type?: TicketType
  order?: Order
  seat?: Seat
  actions?: VerificationAction[]
}

export interface VerificationAction {
  id: string
  verification_id: string
  from_status: string
  to_status: string
  action: string
  operator: string
  note: string | null
  created_at: string
}

export interface VerificationTransition {
  from_status: VerificationStatus
  to_status: VerificationStatus
  label: string
  requires_note: boolean
}

export interface CreateVerificationRequest {
  ticket_no: string
  event_id: string
  ticket_type_id: string
  order_id: string
  seat_id?: string | null
  assignee?: string | null
  source?: string | null
  source_reference?: string | null
  verification_code?: string | null
}

export interface TransitionRequest {
  to_status: VerificationStatus
  operator: string
  note?: string | null
  dispute_reason?: string | null
  supplement_note?: string | null
  escalation_target?: string | null
}

export interface EfficiencyStats {
  total: number
  verified: number
  avg_time_hours: number
  efficiency_rate: number
}

export interface SourceGroupStats {
  source: string
  count: number
  closed_count: number
  disputed_count: number
}

export interface AssigneeGroupStats {
  assignee: string
  count: number
  closed_count: number
  avg_time_hours: number
}

export interface ConclusionGroupStats {
  conclusion: string
  count: number
}

export interface SummaryFilterParams {
  date_from?: string
  date_to?: string
  source?: SourceType
  assignee?: string
  conclusion?: string
}

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: '待处理',
  in_progress: '核销中',
  disputed: '争议中',
  supplementing: '补充材料',
  escalated: '已升级',
  closed_normal: '正常关闭',
  closed_dispute: '争议关闭',
}

export const STATUS_LABEL_MAP: Record<string, string> = {
  ...STATUS_LABELS,
  pending_payment: '待支付',
  paid: '已支付',
  cancelled: '已取消',
  refunded: '已退款',
  disputed: '争议中',
  active: '活跃',
  inactive: '未激活',
  sold_out: '已售罄',
  scheduled: '计划中',
  ongoing: '进行中',
  completed: '已完成',
  available: '可选',
  reserved: '已预留',
  occupied: '已占用',
  disabled: '不可用',
}

export const SOURCE_LABELS: Record<string, string> = {
  online: '线上',
  offline: '线下',
  import: '导入',
  manual: '手工',
}

export const AVAILABLE_TRANSITIONS: Record<VerificationStatus, VerificationTransition[]> = {
  pending: [
    { from_status: 'pending', to_status: 'in_progress', label: '开始核销', requires_note: false },
  ],
  in_progress: [
    { from_status: 'in_progress', to_status: 'closed_normal', label: '正常关闭', requires_note: true },
    { from_status: 'in_progress', to_status: 'disputed', label: '标记争议', requires_note: true },
  ],
  disputed: [
    { from_status: 'disputed', to_status: 'supplementing', label: '补充材料', requires_note: false },
    { from_status: 'disputed', to_status: 'escalated', label: '升级处理', requires_note: true },
    { from_status: 'disputed', to_status: 'closed_dispute', label: '争议关闭', requires_note: true },
  ],
  supplementing: [
    { from_status: 'supplementing', to_status: 'disputed', label: '继续争议', requires_note: false },
    { from_status: 'supplementing', to_status: 'closed_normal', label: '正常关闭', requires_note: true },
    { from_status: 'supplementing', to_status: 'closed_dispute', label: '争议关闭', requires_note: true },
  ],
  escalated: [
    { from_status: 'escalated', to_status: 'closed_dispute', label: '争议关闭', requires_note: true },
    { from_status: 'escalated', to_status: 'closed_normal', label: '正常关闭', requires_note: true },
    { from_status: 'escalated', to_status: 'supplementing', label: '退回补充', requires_note: false },
  ],
  closed_normal: [],
  closed_dispute: [],
}
