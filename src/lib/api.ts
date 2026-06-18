import type {
  DashboardKPI,
  StoreMapPoint,
  TurnoverTrend,
  MaterialHeatmap,
  VehicleListItem,
  VehicleDetail,
  DiffSummary,
  DiffRecord,
  TurnoverComparison,
  TurnoverGapSample,
  MaterialTrendPoint,
} from "@/types"

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api"

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status} ${url}: ${errText}`)
  }
  return (await res.json()) as T
}

export async function health() {
  return request<{ status: string; version: string; database: string }>("/health")
}

export const dashboardApi = {
  kpi: () => request<DashboardKPI>("/dashboard/kpi"),
  stores: () => request<StoreMapPoint[]>("/dashboard/stores"),
  turnoverTrends: () => request<TurnoverTrend[]>("/dashboard/turnover-trends"),
  materialHeatmap: () => request<MaterialHeatmap[]>("/dashboard/material-heatmap"),
  materialTrends: () => request<MaterialTrendPoint[]>("/dashboard/material-trends"),
}

export const vehiclesApi = {
  list: (params?: {
    page?: number
    page_size?: number
    status?: string
    store_id?: string
    keyword?: string
  }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
      })
    }
    const q = qs.toString()
    return request<VehicleListItem[]>(`/vehicles${q ? `?${q}` : ""}`)
  },
  detail: (vehicle_id: string) => request<VehicleDetail>(`/vehicles/${vehicle_id}`),
}

export const diffsApi = {
  summary: () => request<DiffSummary>("/diffs/summary"),
  records: (params?: {
    page?: number
    page_size?: number
    resolved?: boolean
    source?: string
    field_name?: string
  }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
      })
    }
    const q = qs.toString()
    return request<DiffRecord[]>(`/diffs/records${q ? `?${q}` : ""}`)
  },
}

export const turnoverApi = {
  comparison: () => request<TurnoverComparison[]>("/turnover/comparison"),
  gapSamples: (params?: {
    page?: number
    page_size?: number
    store_id?: string
  }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
      })
    }
    const q = qs.toString()
    return request<TurnoverGapSample[]>(`/turnover/gap-samples${q ? `?${q}` : ""}`)
  },
}

export const apiClient = {
  health,
  dashboard: dashboardApi,
  vehicles: vehiclesApi,
  diffs: diffsApi,
  turnover: turnoverApi,
}

export default apiClient
