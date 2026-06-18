import { get, post, del, downloadFile } from '@/lib/request'
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

export interface ShareLinkValidation {
  valid: boolean
  permissions: ('view' | 'export')[]
  includesTurnoverMetrics: boolean
  filters: FilterState
  expiresAt: string
}

function buildFilterParams(filters?: FilterState): Record<string, unknown> {
  if (!filters) return {}
  const params: Record<string, unknown> = {}
  if (filters.storeIds?.length) params['storeIds'] = filters.storeIds
  if (filters.dateRange?.start) params['startDate'] = filters.dateRange.start
  if (filters.dateRange?.end) params['endDate'] = filters.dateRange.end
  if (filters.brands?.length) params['brands'] = filters.brands
  if (filters.sourceTypes?.length) params['sourceTypes'] = filters.sourceTypes
  if (filters.vehicleCondition?.length) params['vehicleCondition'] = filters.vehicleCondition
  return params
}

export async function fetchOverview(shareToken?: string): Promise<DashboardOverview> {
  return get<DashboardOverview>('/api/dashboard/overview', {
    shareToken,
  })
}

export async function fetchVehicleTrend(
  filters?: FilterState,
  viewId?: string,
  shareToken?: string,
): Promise<VehicleArchiveTrend[]> {
  const params = {
    ...buildFilterParams(filters),
    ...(viewId ? { viewId } : {}),
  }
  return get<VehicleArchiveTrend[]>('/api/dashboard/vehicle-trend', {
    params,
    shareToken,
  })
}

export async function fetchInspectionReport(
  filters?: FilterState,
  viewId?: string,
  shareToken?: string,
): Promise<InspectionReportComposition> {
  const params = {
    ...buildFilterParams(filters),
    ...(viewId ? { viewId } : {}),
  }
  return get<InspectionReportComposition>('/api/dashboard/inspection-report', {
    params,
    shareToken,
  })
}

export async function fetchPrepList(
  filters?: FilterState,
  viewId?: string,
  shareToken?: string,
): Promise<PrepListDetail> {
  const params = {
    ...buildFilterParams(filters),
    ...(viewId ? { viewId } : {}),
  }
  return get<PrepListDetail>('/api/dashboard/prep-list', {
    params,
    shareToken,
  })
}

export async function fetchTestDriveAnomaly(
  filters?: FilterState,
  viewId?: string,
  shareToken?: string,
): Promise<TestDriveAnomaly> {
  const params = {
    ...buildFilterParams(filters),
    ...(viewId ? { viewId } : {}),
  }
  return get<TestDriveAnomaly>('/api/dashboard/test-drive-anomaly', {
    params,
    shareToken,
  })
}

export async function fetchFilterViews(): Promise<FilterView[]> {
  return get<FilterView[]>('/api/dashboard/filter-views')
}

export async function saveFilterView(view: Omit<FilterView, 'id' | 'createdAt' | 'updatedAt'>): Promise<FilterView> {
  return post<FilterView>('/api/dashboard/filter-views', view)
}

export async function deleteFilterView(id: string): Promise<void> {
  return del<void>(`/api/dashboard/filter-views/${id}`)
}

export async function createShareLink(
  permissions: ('view' | 'export')[],
  includeTurnover: boolean,
  filters: FilterState,
  viewId?: string,
): Promise<ShareLink> {
  return post<ShareLink>('/api/dashboard/share-links', {
    permissions,
    includesTurnoverMetrics: includeTurnover,
    filters,
    viewId,
  })
}

export async function validateShareLink(token: string): Promise<ShareLinkValidation> {
  return get<ShareLinkValidation>(`/api/dashboard/share-links/${token}`, {
    skipAuth: true,
    shareToken: token,
  })
}

export async function exportReport(
  format: 'pdf' | 'excel',
  filters: FilterState,
  includeTurnover: boolean,
  viewId?: string,
  shareToken?: string,
): Promise<string> {
  const params = {
    ...buildFilterParams(filters),
    includeTurnover,
    ...(viewId ? { viewId } : {}),
  }

  const endpoint = format === 'pdf' ? '/api/dashboard/export/pdf' : '/api/dashboard/export/excel'
  const fileName = `车源上架趋势报告_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`

  await downloadFile(
    endpoint,
    {
      params,
      shareToken,
      timeout: 120000,
    },
    fileName,
  )

  return fileName
}

export { getMockOverview, getMockVehicleTrend, getMockInspectionReport, getMockPrepList, getMockTestDriveAnomaly, getMockFilterViews, getMockShareLink } from '@/mock/data'
