import type {
  DashboardOverview,
  VehicleArchiveTrend,
  InspectionReportComposition,
  PrepListDetail,
  TestDriveAnomaly,
  TestDriveAnomalyItem,
  FilterView,
  ShareLink,
} from '@/types'

export function generateDailyData(days: number, baseCount: number): Array<{ date: string; count: number }> {
  const result: Array<{ date: string; count: number }> = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const variance = Math.floor(Math.random() * baseCount * 0.6) - Math.floor(baseCount * 0.3)
    result.push({ date: dateStr, count: Math.max(0, baseCount + variance) })
  }
  return result
}

const brands = ['宝马', '奔驰', '奥迪', '大众', '丰田', '本田', '特斯拉', '蔚来', '理想', '小鹏']
const stores = ['门店A-朝阳店', '门店B-海淀店', '门店C-丰台店']
const sources: Array<'inspection' | 'finance' | 'inventory'> = ['inspection', 'finance', 'inventory']

export function getMockOverview(): DashboardOverview {
  return {
    lastRefreshTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    dataSources: {
      inspection: { status: 'online', lastSync: '2 分钟前' },
      finance: { status: 'online', lastSync: '5 分钟前' },
      inventory: { status: 'delayed', lastSync: '15 分钟前' },
    },
    summary: {
      totalListed: 1284,
      weekOverWeek: 12.3,
      monthOverMonth: -3.5,
      inspectionPassRate: 78.6,
      avgPrepDays: 5.2,
      abnormalTestDrives: 7,
    },
    turnover: {
      avgTurnoverDays: 38.5,
      turnoverRate: 2.4,
      fastMovingCount: 312,
      slowMovingCount: 156,
      definition:
        '库存周转天数 = 统计期内平均库存量 / 统计期内日均出库量；周转率 = 统计期内出库总量 / 平均库存量；快消定义为≤30天，滞销定义为≥60天',
    },
  }
}

export function getMockVehicleTrend(): VehicleArchiveTrend[] {
  const dailyData = generateDailyData(30, 45)
  return dailyData.map((d) => {
    const delisted = Math.floor(d.count * (0.1 + Math.random() * 0.15))
    return {
      period: d.date,
      listed: d.count,
      delisted,
      netChange: d.count - delisted,
      wowChange: parseFloat((Math.random() * 30 - 15).toFixed(1)),
      details: Array.from({ length: d.count }, (_, i) => ({
        date: d.date,
        count: 1,
        brand: brands[Math.floor(Math.random() * brands.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
      })).slice(0, 5),
    }
  })
}

export function getMockInspectionReport(): InspectionReportComposition {
  const totalInspected = 856
  const passed = Math.floor(totalInspected * 0.72)
  const failed = Math.floor(totalInspected * 0.18)
  const pending = totalInspected - passed - failed

  const trendByWeek = Array.from({ length: 12 }, (_, i) => {
    const weekDate = new Date()
    weekDate.setDate(weekDate.getDate() - (11 - i) * 7)
    const wTotal = 60 + Math.floor(Math.random() * 40)
    return {
      week: `${weekDate.getMonth() + 1}/${weekDate.getDate()}`,
      passed: Math.floor(wTotal * (0.6 + Math.random() * 0.2)),
      failed: Math.floor(wTotal * (0.1 + Math.random() * 0.15)),
      pending: 0,
    }
  })
  trendByWeek.forEach((w) => {
    w.pending = 60 + Math.floor(Math.random() * 40) - w.passed - w.failed
  })

  const failureReasons = [
    { reason: '外观损伤', count: 45, percentage: 28.1 },
    { reason: '发动机异常', count: 32, percentage: 20.0 },
    { reason: '变速箱故障', count: 25, percentage: 15.6 },
    { reason: '底盘问题', count: 22, percentage: 13.8 },
    { reason: '电气系统', count: 18, percentage: 11.3 },
    { reason: '其他', count: 18, percentage: 11.2 },
  ]

  return { summary: { passed, failed, pending }, trendByWeek, failureReasons }
}

export function getMockPrepList(): PrepListDetail {
  const overdueItems: PrepListDetail['overdueItems'] = Array.from({ length: 8 }, (_, i) => ({
    vehicleId: `VH${String(10000 + i).slice(1)}`,
    brand: brands[i % brands.length],
    model: `${['3系', 'C级', 'A4L', '迈腾', '凯美瑞', '雅阁', 'Model 3', 'ES6', 'L7', 'P7'][i % 10]}`,
    prepDays: 7 + Math.floor(Math.random() * 8),
    expectedDays: 5,
    status: i < 2 ? 'overdue' : i < 5 ? 'in_progress' : 'not_started',
    financeApproval: i < 3 ? '已审批' : i < 6 ? '审批中' : '未提交',
  }))

  return {
    statusDistribution: {
      notStarted: 23,
      inProgress: 45,
      completed: 167,
      overdue: 12,
    },
    avgPrepDays: 5.2,
    overdueItems,
  }
}

export function getMockTestDriveAnomaly(): TestDriveAnomaly {
  const dailyDistribution = generateDailyData(30, 15).map((d) => ({
    date: d.date,
    normalCount: Math.max(1, d.count - Math.floor(Math.random() * 3)),
    abnormalCount: Math.floor(Math.random() * 4),
  }))

  const anomalyTypes: TestDriveAnomalyItem['type'][] = ['accident_test', 'overspeed', 'unauthorized_route', 'long_duration']
  const severityLevels: TestDriveAnomalyItem['severity'][] = ['low', 'medium', 'high']
  const descriptions: Record<string, string> = {
    accident_test: '事故车辆被安排试驾',
    overspeed: '试驾过程中超速',
    unauthorized_route: '偏离规定试驾路线',
    long_duration: '试驾时长异常偏长',
  }

  const anomalies: TestDriveAnomalyItem[] = Array.from({ length: 7 }, (_, i) => {
    const type = anomalyTypes[i % 4]
    return {
      vehicleId: `VH${String(2000 + i)}`,
      date: dailyDistribution[dailyDistribution.length - 1 - i]?.date ?? new Date().toISOString().split('T')[0],
      type,
      description: descriptions[type],
      severity: severityLevels[Math.min(i, 2)],
    }
  })

  return {
    totalDrives: 423,
    abnormalCount: 7,
    dailyDistribution,
    anomalies,
  }
}

export function getMockFilterViews(): FilterView[] {
  return [
    {
      id: 'fv1',
      name: '早会默认口径',
      isDefault: true,
      filters: {
        storeIds: ['门店A-朝阳店'],
        dateRange: { start: '2026-05-20', end: '2026-06-19' },
        brands: [],
        sourceTypes: [],
        vehicleCondition: [],
      },
      createdAt: '2026-06-01 08:00:00',
      updatedAt: '2026-06-19 07:30:00',
    },
    {
      id: 'fv2',
      name: '全门店月度复盘',
      isDefault: false,
      filters: {
        storeIds: ['门店A-朝阳店', '门店B-海淀店', '门店C-丰台店'],
        dateRange: { start: '2026-05-01', end: '2026-05-31' },
        brands: [],
        sourceTypes: [],
        vehicleCondition: [],
      },
      createdAt: '2026-05-31 18:00:00',
      updatedAt: '2026-06-15 09:00:00',
    },
    {
      id: 'fv3',
      name: '新能源专项',
      isDefault: false,
      filters: {
        storeIds: [],
        dateRange: { start: '2026-06-01', end: '2026-06-19' },
        brands: ['特斯拉', '蔚来', '理想', '小鹏'],
        sourceTypes: [],
        vehicleCondition: [],
      },
      createdAt: '2026-06-10 10:00:00',
      updatedAt: '2026-06-18 16:00:00',
    },
  ]
}

export function getMockShareLink(): ShareLink {
  return {
    token: 'share_abc123def456',
    url: `${window.location.origin}/share/share_abc123def456`,
    expiresIn: 86400,
    permissions: ['view'],
    includesTurnoverMetrics: true,
  }
}

export const storeOptions = stores
export const brandOptions = brands
export const sourceTypeOptions = [
  { label: '检测仪', value: 'inspection' },
  { label: '金融审批', value: 'finance' },
  { label: '车源库', value: 'inventory' },
]
export const conditionOptions = ['优秀', '良好', '一般', '较差']
