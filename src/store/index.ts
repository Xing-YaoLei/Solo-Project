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

const EMPTY_KPI: DashboardKPI = {
  total_vehicles: 0,
  transfer_completion_rate: 0,
  avg_turnover_days: 0,
  material_missing_rate: 0,
  kpi_trends: [],
}

const EMPTY_DIFF: DiffSummary = {
  source_vs_crm: { total: 0, resolved: 0, pending: 0 },
  detector_version_diff: { total: 0, versions: [] },
}

interface LoadState {
  loading: boolean
  error: string | null
}

interface AppState {
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

  selectedVehicleId: string | null
  selectedMaterialType: string | null
  selectedStoreName: string | null
  diffFilterSource: string | null
  diffFilterResolved: string | null
  turnoverTimeRange: string
  apiConnected: boolean
  loadStates: Record<string, LoadState>

  setSelectedVehicleId: (id: string | null) => void
  setSelectedMaterialType: (t: string | null) => void
  setSelectedStoreName: (s: string | null) => void
  setDiffFilterSource: (s: string | null) => void
  setDiffFilterResolved: (s: string | null) => void
  setTurnoverTimeRange: (r: string) => void

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

  _ls: (key: string, patch: Partial<LoadState>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  dashboardKPI: EMPTY_KPI,
  storeMapPoints: [],
  turnoverTrends: [],
  materialHeatmap: [],
  materialTrendPoints: [],
  vehicleList: [],
  vehicleDetail: {},
  diffSummary: EMPTY_DIFF,
  diffRecords: [],
  turnoverComparisons: [],
  turnoverGapSamples: [],

  selectedVehicleId: null,
  selectedMaterialType: null,
  selectedStoreName: null,
  diffFilterSource: null,
  diffFilterResolved: null,
  turnoverTimeRange: "12m",
  apiConnected: false,
  loadStates: {},

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedMaterialType: (t) => set({ selectedMaterialType: t }),
  setSelectedStoreName: (s) => set({ selectedStoreName: s }),
  setDiffFilterSource: (s) => set({ diffFilterSource: s }),
  setDiffFilterResolved: (s) => set({ diffFilterResolved: s }),
  setTurnoverTimeRange: (r) => set({ turnoverTimeRange: r }),

  _ls: (key, patch) =>
    set((s) => ({
      loadStates: {
        ...s.loadStates,
        [key]: { loading: false, error: null, ...s.loadStates[key], ...patch },
      },
    })),

  fetchHealth: async () => {
    try {
      const r = await apiClient.health()
      set({ apiConnected: r.status === "ok" })
    } catch {
      set({ apiConnected: false })
    }
  },

  fetchDashboardKPI: async () => {
    get()._ls("dashboardKPI", { loading: true })
    try {
      const d = await apiClient.dashboard.kpi()
      set({ dashboardKPI: d })
      get()._ls("dashboardKPI", { loading: false })
    } catch (e) {
      get()._ls("dashboardKPI", { loading: false, error: String(e) })
    }
  },

  fetchStoreMapPoints: async () => {
    get()._ls("storeMapPoints", { loading: true })
    try {
      const d = await apiClient.dashboard.stores()
      set({ storeMapPoints: d })
      get()._ls("storeMapPoints", { loading: false })
    } catch (e) {
      get()._ls("storeMapPoints", { loading: false, error: String(e) })
    }
  },

  fetchTurnoverTrends: async () => {
    get()._ls("turnoverTrends", { loading: true })
    try {
      const d = await apiClient.dashboard.turnoverTrends()
      set({ turnoverTrends: d })
      get()._ls("turnoverTrends", { loading: false })
    } catch (e) {
      get()._ls("turnoverTrends", { loading: false, error: String(e) })
    }
  },

  fetchMaterialHeatmap: async () => {
    get()._ls("materialHeatmap", { loading: true })
    try {
      const d = await apiClient.dashboard.materialHeatmap()
      set({ materialHeatmap: d })
      get()._ls("materialHeatmap", { loading: false })
    } catch (e) {
      get()._ls("materialHeatmap", { loading: false, error: String(e) })
    }
  },

  fetchMaterialTrend: async () => {
    get()._ls("materialTrendPoints", { loading: true })
    try {
      const d = await apiClient.dashboard.materialTrends()
      set({ materialTrendPoints: d })
      get()._ls("materialTrendPoints", { loading: false })
    } catch (e) {
      get()._ls("materialTrendPoints", { loading: false, error: String(e) })
    }
  },

  fetchVehicleList: async () => {
    get()._ls("vehicleList", { loading: true })
    try {
      const d = await apiClient.vehicles.list({ page_size: 100 })
      set({ vehicleList: d })
      get()._ls("vehicleList", { loading: false })
    } catch (e) {
      get()._ls("vehicleList", { loading: false, error: String(e) })
    }
  },

  fetchVehicleDetail: async (vehicle_id, force = false) => {
    const key = `vehicleDetail:${vehicle_id}`
    if (get().vehicleDetail[vehicle_id] && !force) return
    get()._ls(key, { loading: true })
    try {
      const d = await apiClient.vehicles.detail(vehicle_id)
      set((s) => ({ vehicleDetail: { ...s.vehicleDetail, [vehicle_id]: d } }))
      get()._ls(key, { loading: false })
    } catch (e) {
      get()._ls(key, { loading: false, error: String(e) })
    }
  },

  fetchDiffSummary: async () => {
    get()._ls("diffSummary", { loading: true })
    try {
      const d = await apiClient.diffs.summary()
      set({ diffSummary: d })
      get()._ls("diffSummary", { loading: false })
    } catch (e) {
      get()._ls("diffSummary", { loading: false, error: String(e) })
    }
  },

  fetchDiffRecords: async () => {
    get()._ls("diffRecords", { loading: true })
    try {
      const d = await apiClient.diffs.records({ page_size: 50 })
      set({ diffRecords: d })
      get()._ls("diffRecords", { loading: false })
    } catch (e) {
      get()._ls("diffRecords", { loading: false, error: String(e) })
    }
  },

  fetchTurnoverComparisons: async () => {
    get()._ls("turnoverComparisons", { loading: true })
    try {
      const d = await apiClient.turnover.comparison()
      set({ turnoverComparisons: d })
      get()._ls("turnoverComparisons", { loading: false })
    } catch (e) {
      get()._ls("turnoverComparisons", { loading: false, error: String(e) })
    }
  },

  fetchTurnoverGapSamples: async () => {
    get()._ls("turnoverGapSamples", { loading: true })
    try {
      const d = await apiClient.turnover.gapSamples({ page_size: 30 })
      set({ turnoverGapSamples: d })
      get()._ls("turnoverGapSamples", { loading: false })
    } catch (e) {
      get()._ls("turnoverGapSamples", { loading: false, error: String(e) })
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
