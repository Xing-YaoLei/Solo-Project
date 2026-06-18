import type {
  DashboardOverview,
  VehicleArchiveTrend,
  InspectionReportComposition,
  PrepListDetail,
  TestDriveAnomaly,
  FilterView,
  ShareLink,
  FilterState,
} from '@/types'
import {
  getMockOverview,
  getMockVehicleTrend,
  getMockInspectionReport,
  getMockPrepList,
  getMockTestDriveAnomaly,
  getMockFilterViews,
  getMockShareLink,
} from '@/mock/data'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchOverview(): Promise<DashboardOverview> {
  await delay(300)
  return getMockOverview()
}

export async function fetchVehicleTrend(filters?: FilterState): Promise<VehicleArchiveTrend[]> {
  await delay(400)
  console.debug('fetchVehicleTrend filters:', filters)
  return getMockVehicleTrend()
}

export async function fetchInspectionReport(filters?: FilterState): Promise<InspectionReportComposition> {
  await delay(350)
  console.debug('fetchInspectionReport filters:', filters)
  return getMockInspectionReport()
}

export async function fetchPrepList(filters?: FilterState): Promise<PrepListDetail> {
  await delay(300)
  console.debug('fetchPrepList filters:', filters)
  return getMockPrepList()
}

export async function fetchTestDriveAnomaly(filters?: FilterState): Promise<TestDriveAnomaly> {
  await delay(350)
  console.debug('fetchTestDriveAnomaly filters:', filters)
  return getMockTestDriveAnomaly()
}

export async function fetchFilterViews(): Promise<FilterView[]> {
  await delay(200)
  return getMockFilterViews()
}

export async function saveFilterView(view: FilterView): Promise<FilterView> {
  await delay(200)
  return view
}

export async function deleteFilterView(id: string): Promise<void> {
  await delay(200)
  console.debug('deleteFilterView:', id)
}

export async function createShareLink(permissions: ('view' | 'export')[], includeTurnover: boolean): Promise<ShareLink> {
  await delay(300)
  const link = getMockShareLink()
  link.permissions = permissions
  link.includesTurnoverMetrics = includeTurnover
  return link
}

export async function exportReport(format: 'pdf' | 'excel', filters: FilterState, includeTurnover: boolean): Promise<string> {
  await delay(500)
  console.debug('exportReport:', format, filters, includeTurnover)
  return `车源上架趋势报告_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
}
