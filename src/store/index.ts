import { create } from "zustand"
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
import { apiClient } from "@/lib/api"
import {
  mockDashboardKPI,
  mockStoreMapPoints,
  mockTurnoverTrends,
  mockMaterialHeatmap,
  mockVehicleList,
  mockDiffSummary,
  mockDiffRecords,
  mockTurnoverComparisons,
  mockTurnoverGapSamples,
  mockMaterialTrend,
  mockVehicleDetail,
} from "@/mock/data"

interface LoadState {
  loading: boolean
  error: string | null
}

interface AppState {
  // Data
  dashboardKPI: DashboardKPI
  storeMapPoints: StoreMapPoint[]
  turnoverTrends: TurnoverTrend[]
  materialHeatmap: MaterialHeatmap[]
  materialTrendPoints: MaterialTrendPoint[]
  vehicleList: VehicleListItem[]
  vehicleDetail: Record<string, VehicleDetail>
  diffSummary: DiffSummary
  diffRecords: DiffRecord[]
  turnoverComparisons: TurnoverComparison[]
  turnoverGapSamples: TurnoverGapSample[]

  // UI State
  selectedVehicleId: string | null
  selectedMaterialType: string | null
  selectedStoreName: string | null
  diffFilterSource: string | null
  diffFilterResolved: string | null
  turnoverTimeRange: string
  apiConnected: boolean

  // Load states
  loadStates: Record<string, LoadState>

  // Actions - UI
  setSelectedVehicleId: (id: string | null) => void
  setSelectedMaterialType: (t: string | null) => void
  setSelectedStoreName: (s: string | null) => void
  setDiffFilterSource: (s: string | null) => void
  setDiffFilterResolved: (s: string | null) => void
  setTurnoverTimeRange: (r: string) => void

  // Actions - Data fetchers
  fetchHealth: () => Promise<void>
  fetchDashboardKPI: () => Promise<void>
  fetchStoreMapPoints: () => Promise<void>
  fetchTurnoverTrends: () => Promise<void>
  fetchMaterialHeatmap: () => Promise<void>
  fetchMaterialTrend: () => Promise<void>
  fetchVehicleList: () => Promise<void>
  fetchVehicleDetail: (vehicle_id: string, force?: boolean) => Promise<void>
  fetchDiffSummary: () => Promise<void>
  fetchDiffRecords: () => Promise<void>
  fetchTurnoverComparisons: () => Promise<void>
  fetchTurnoverGapSamples: () => Promise<void>
  fetchAll: () => Promise<void>

  // Utility
  _setLoadState: (key: string, state: Partial<LoadState>) => void
  _fallback: <T>(key: string, fallback: T, err: unknown) => T
}

export const useAppStore = create<AppState>((set, get) => ({
  // ------- Initial data (fallbacks before API loads) -------
  dashboardKPI: mockDashboardKPI,
  storeMapPoints: mockStoreMapPoints,
  turnoverTrends: mockTurnoverTrends,
  materialHeatmap: mockMaterialHeatmap,
  materialTrendPoints: mockMaterialTrend,
  vehicleList: mockVehicleList,
  vehicleDetail: mockVehicleDetail,
  diffSummary: mockDiffSummary,
  diffRecords: mockDiffRecords,
  turnoverComparisons: mockTurnoverComparisons,
  turnoverGapSamples: mockTurnoverGapSamples,

  // ------- UI State -------
  selectedVehicleId: null,
  selectedMaterialType: null,
  selectedStoreName: null,
  diffFilterSource: null,
  diffFilterResolved: null,
  turnoverTimeRange: "12m",
  apiConnected: false,

  loadStates: {},

  // ------- UI setters -------
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedMaterialType: (t) => set({ selectedMaterialType: t }),
  setSelectedStoreName: (s) => set({ selectedStoreName: s }),
  setDiffFilterSource: (s) => set({ diffFilterSource: s }),
  setDiffFilterResolved: (s) => set({ diffFilterResolved: s }),
  setTurnoverTimeRange: (r) => set({ turnoverTimeRange: r }),

  // ------- Utilities -------
  _setLoadState: (key, state) =>
    set((s) => ({
      loadStates: { ...s.loadStates, [key]: { loading: false, error: null, ...s.loadStates[key], ...state } },
    })),

  _fallback: <T,>(key: string, fallback: T, err: unknown): T => {
    console.warn(`[api] ${key} failed, using fallback:`, err)
    return fallback
  },

  // ------- Fetchers -------
  fetchHealth: async () => {
    const key = "health"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const res = await apiClient.health()
      set({ apiConnected: res.status === "ok" })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      set({ apiConnected: false })
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchDashboardKPI: async () => {
    const key = "dashboardKPI"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.dashboard.kpi()
      set({ dashboardKPI: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchStoreMapPoints: async () => {
    const key = "storeMapPoints"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.dashboard.stores()
      set({ storeMapPoints: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchTurnoverTrends: async () => {
    const key = "turnoverTrends"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.dashboard.turnoverTrends()
      set({ turnoverTrends: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchMaterialHeatmap: async () => {
    const key = "materialHeatmap"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.dashboard.materialHeatmap()
      set({ materialHeatmap: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchMaterialTrend: async () => {
    const key = "materialTrendPoints"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.dashboard.materialTrends()
      set({ materialTrendPoints: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchVehicleList: async () => {
    const key = "vehicleList"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.vehicles.list({ page_size: 50 })
      set({ vehicleList: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchVehicleDetail: async (vehicle_id, force = false) => {
    const key = `vehicleDetail:${vehicle_id}`
    const existing = get().vehicleDetail[vehicle_id]
    if (existing && !force) return

    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.vehicles.detail(vehicle_id)
      set((s) => ({ vehicleDetail: { ...s.vehicleDetail, [vehicle_id]: data } }))
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchDiffSummary: async () => {
    const key = "diffSummary"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.diffs.summary()
      set({ diffSummary: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchDiffRecords: async () => {
    const key = "diffRecords"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.diffs.records({ page_size: 50 })
      set({ diffRecords: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchTurnoverComparisons: async () => {
    const key = "turnoverComparisons"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.turnover.comparison()
      set({ turnoverComparisons: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchTurnoverGapSamples: async () => {
    const key = "turnoverGapSamples"
    get()._setLoadState(key, { loading: true, error: null })
    try {
      const data = await apiClient.turnover.gapSamples({ page_size: 30 })
      set({ turnoverGapSamples: data })
      get()._setLoadState(key, { loading: false })
    } catch (e) {
      get()._setLoadState(key, { loading: false, error: String(e) })
    }
  },

  fetchAll: async () => {
    await get().fetchHealth()
    await Promise.allSettled([
      get().fetchDashboardKPI(),
      get().fetchStoreMapPoints(),
      get().fetchTurnoverTrends(),
      get().fetchMaterialHeatmap(),
      get().fetchMaterialTrend(),
      get().fetchVehicleList(),
      get().fetchDiffSummary(),
      get().fetchDiffRecords(),
      get().fetchTurnoverComparisons(),
      get().fetchTurnoverGapSamples(),
    ])
  },
}))
