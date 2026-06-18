export interface DataSourceStatus {
  status: 'online' | 'offline' | 'delayed'
  lastSync: string
}

export interface InventoryTurnoverMetrics {
  avgTurnoverDays: number
  turnoverRate: number
  fastMovingCount: number
  slowMovingCount: number
  definition: string
}

export interface DashboardOverview {
  lastRefreshTime: string
  dataSources: {
    inspection: DataSourceStatus
    finance: DataSourceStatus
    inventory: DataSourceStatus
  }
  summary: {
    totalListed: number
    weekOverWeek: number
    monthOverMonth: number
    inspectionPassRate: number
    avgPrepDays: number
    abnormalTestDrives: number
  }
  turnover: InventoryTurnoverMetrics
}

export interface VehicleTrendDetail {
  date: string
  count: number
  brand: string
  source: 'inspection' | 'finance' | 'inventory'
}

export interface VehicleArchiveTrend {
  period: string
  listed: number
  delisted: number
  netChange: number
  wowChange: number
  details: VehicleTrendDetail[]
}

export interface InspectionReportComposition {
  summary: {
    passed: number
    failed: number
    pending: number
  }
  trendByWeek: Array<{
    week: string
    passed: number
    failed: number
    pending: number
  }>
  failureReasons: Array<{
    reason: string
    count: number
    percentage: number
  }>
}

export interface PrepOverdueItem {
  vehicleId: string
  brand: string
  model: string
  prepDays: number
  expectedDays: number
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  financeApproval: string
}

export interface PrepListDetail {
  statusDistribution: {
    notStarted: number
    inProgress: number
    completed: number
    overdue: number
  }
  avgPrepDays: number
  overdueItems: PrepOverdueItem[]
}

export interface TestDriveAnomalyItem {
  vehicleId: string
  date: string
  type: 'accident_test' | 'overspeed' | 'unauthorized_route' | 'long_duration'
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface TestDriveAnomaly {
  totalDrives: number
  abnormalCount: number
  dailyDistribution: Array<{
    date: string
    normalCount: number
    abnormalCount: number
  }>
  anomalies: TestDriveAnomalyItem[]
}

export interface FilterState {
  storeIds: string[]
  dateRange: { start: string; end: string }
  brands: string[]
  sourceTypes: string[]
  vehicleCondition: string[]
}

export interface FilterView {
  id: string
  name: string
  isDefault: boolean
  filters: FilterState
  createdAt: string
  updatedAt: string
}

export interface ShareLink {
  token: string
  url: string
  expiresAt: string
  permissions: ('view' | 'export')[]
  includesTurnoverMetrics: boolean
}
