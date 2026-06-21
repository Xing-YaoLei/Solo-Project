export type OrderStatus = 'pending' | 'accepted' | 'picked' | 'delivered' | 'cancelled'
export type TaskType = 'item_damage' | 'dispatch_timeout'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'processing' | 'resolved' | 'closed'
export type DamageLevel = 'minor' | 'moderate' | 'severe'
export type AppealStatus = 'pending' | 'approved' | 'rejected'
export type AppealType = 'subsidy' | 'damage' | 'late_dispatch'
export type CsType = 'complaint' | 'appeal' | 'inquiry' | 'damage_report'
export type CsStatus = 'open' | 'processing' | 'closed'
export type UserRole = 'analyst' | 'auditor' | 'supervisor'
export type ChartType = 'funnel' | 'dispatch_trend' | 'payment_trend'

export interface Order {
  id: string
  orderNo: string
  routeId: string
  routeName: string
  amount: number
  subsidyAmount: number
  itemDescription?: string | null
  hasItemDamage: boolean
  itemDamageLevel?: DamageLevel | null
  status: OrderStatus
  createdAt: Date
  acceptedAt?: Date | null
  pickedAt?: Date | null
  deliveredAt?: Date | null
  dispatchDuration?: number | null
  riderId: string
  riderName: string
  customerId: string
  customerName: string
  paymentId?: string | null
  appealId?: string | null
}

export interface Payment {
  id: string
  orderId: string
  transactionNo: string
  amount: number
  subsidyAmount: number
  settlementAmount: number
  paymentMethod: string
  status: string
  paidAt?: Date | null
  settlementDate?: Date | null
  abnormalDeduction?: number | null
  deductionReason?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CustomerServiceRecord {
  id: string
  orderId: string
  ticketNo: string
  type: CsType
  content: string
  chatHistory?: Record<string, unknown> | null
  operatorId: string
  operatorName: string
  createdAt: Date
  closedAt?: Date | null
  status: CsStatus
}

export interface Appeal {
  id: string
  orderId: string
  type: AppealType
  reason: string
  evidenceUrls: string[]
  status: AppealStatus
  reviewerId?: string | null
  reviewComment?: string | null
  reviewedAt?: Date | null
  createdAt: Date
}

export interface Task {
  id: string
  orderId: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  title: string
  description?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  dispatchDuration?: number | null
  damageLevel?: DamageLevel | null
  createdAt: Date
  resolvedAt?: Date | null
  resolution?: string | null
}

export interface Conclusion {
  id: string
  orderId: string
  taskId?: string | null
  chartPointId: string
  chartType: ChartType
  content: string
  authorId: string
  authorName: string
  createdAt: Date
  attachments?: string[] | null
}

export interface SubsidyRule {
  id: string
  routeId: string
  routeName: string
  baseSubsidy: number
  distanceMultiplier: number
  timeMultiplier: number
  peakHourBonus: number
  minSubsidy: number
  maxSubsidy: number
  effectiveFrom: Date
  effectiveTo?: Date | null
  isActive: boolean
}

export interface SystemConfig {
  id: string
  dispatchDurationThreshold: number
  autoCreateTaskOnTimeout: boolean
  autoCreateTaskOnDamage: boolean
  updatedAt: Date
}

export interface FunnelDataPoint {
  stage: 'subsidy_rules' | 'appeals' | 'settlements'
  stageLabel: string
  count: number
  amount: number
  conversionRate: number
  routeId?: string
  date: string
}

export interface DispatchDurationPoint {
  date: string
  avgDuration: number
  maxDuration: number
  minDuration: number
  orderCount: number
  timeoutCount: number
  routeId?: string
}

export interface FunnelResponse {
  data: FunnelDataPoint[]
  summary: {
    totalBudget: number
    appealedAmount: number
    settledAmount: number
    overallConversion: number
  }
}

export interface DispatchDurationResponse {
  data: DispatchDurationPoint[]
  threshold: number
  avgOverall: number
  timeoutRate: number
}

export interface OrderDetail extends Order {
  payment?: Payment | null
  appeal?: Appeal | null
  customerServiceRecs: CustomerServiceRecord[]
  tasks: Task[]
  conclusions: Conclusion[]
}

export interface TaskWithOrder extends Task {
  order: Order
}
