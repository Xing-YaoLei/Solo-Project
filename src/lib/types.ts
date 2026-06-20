export interface ScenicArea {
  id: string
  name: string
  location: string
  createdAt: Date
}

export interface GuideRoute {
  id: string
  scenicAreaId: string
  name: string
  description: string
  totalStops: number
  estimatedDuration: number
  createdAt: Date
  stops?: RouteStop[]
  scenicArea?: ScenicArea
}

export type RouteStopType = "POINT_OF_INTEREST" | "REST_AREA" | "PERFORMANCE_VENUE" | "MERCHANT"

export interface RouteStop {
  id: string
  routeId: string
  stopOrder: number
  name: string
  type: RouteStopType
  longitude: number
  latitude: number
  capacity: number
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"
export type OrderSource = "WECHAT" | "ALIPAY" | "OFFLINE"

export interface MiniProgramOrder {
  id: string
  scenicAreaId: string
  routeId: string
  orderNo: string
  visitorCount: number
  totalAmount: number
  orderTime: Date
  visitDate: Date
  status: OrderStatus
  source: OrderSource
}

export type TransactionCategory = "FOOD" | "SOUVENIR" | "EXPERIENCE" | "OTHER"

export interface MerchantTransaction {
  id: string
  scenicAreaId: string
  merchantName: string
  stopId: string | null
  transactionNo: string
  amount: number
  transactionTime: Date
  category: TransactionCategory
}

export type CongestionLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface CameraStatistic {
  id: string
  scenicAreaId: string
  stopId: string
  cameraId: string
  recordedAt: Date
  visitorCount: number
  congestionLevel: CongestionLevel
  avgStayMinutes: number
}

export type PerformanceStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED"

export interface Performance {
  id: string
  scenicAreaId: string
  stopId: string
  title: string
  scheduledTime: Date
  duration: number
  totalSeats: number
  soldSeats: number
  status: PerformanceStatus
  cancelReason: string | null
}

export type MetricType = "CONGESTION" | "SALES" | "CANCELLATION" | "STAY_DURATION"

export interface ThresholdConfig {
  id: string
  scenicAreaId: string
  metricType: MetricType
  metricName: string
  warnValue: number
  criticalValue: number
  unit: string
  updatedBy: string
  updatedAt: Date
}

export type AlertType = "CONGESTION" | "CANCELLATION" | "REVENUE_DROP" | "ANOMALY"
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface RiskAlert {
  id: string
  scenicAreaId: string
  routeId: string | null
  alertType: AlertType
  severity: AlertSeverity
  title: string
  description: string
  isResolved: boolean
  detectedAt: Date
  resolvedAt: Date | null
}

export interface ReviewMaterial {
  id: string
  scenicAreaId: string
  alertId: string | null
  performanceId: string | null
  title: string
  content: string
  secondaryConsumptionRate: number | null
  visitorImpact: string | null
  revenueImpact: string | null
  recommendations: string | null
  generatedAt: Date
}

export interface RouteRiskSummary {
  routeId: string
  routeName: string
  scenicAreaId: string
  scenicAreaName: string
  totalVisitors: number
  currentVisitors: number
  capacityUtilization: number
  totalRevenue: number
  revenueDelta: number
  alertCount: number
  criticalAlertCount: number
  riskLevel: AlertSeverity
  lastUpdated: Date
}

export interface HeatmapPoint {
  x: number
  y: number
  value: number
  label: string
}

export interface PerformanceSeatData {
  section: string
  total: number
  sold: number
  available: number
}

export interface StopCongestionData {
  stopName: string
  visitorCount: number
  capacity: number
  utilization: number
  congestionLevel: CongestionLevel
  avgStayMinutes: number
}

export interface RouteTimelinePoint {
  time: string
  visitorCount: number
  congestionLevel: CongestionLevel
}

export interface CategoryRevenueData {
  category: string
  revenue: number
  transactionCount: number
}
