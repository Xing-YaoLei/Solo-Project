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
} from "@/types"
import {
  mockDashboardKPI,
  mockStoreMapPoints,
  mockTurnoverTrends,
  mockMaterialHeatmap,
  mockVehicleList,
  mockVehicleDetail,
  mockDiffSummary,
  mockDiffRecords,
  mockTurnoverComparisons,
  mockTurnoverGapSamples,
} from "@/mock/data"

interface AppState {
  dashboardKPI: DashboardKPI
  storeMapPoints: StoreMapPoint[]
  turnoverTrends: TurnoverTrend[]
  materialHeatmap: MaterialHeatmap[]
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
  setSelectedVehicleId: (id: string | null) => void
  setSelectedMaterialType: (t: string | null) => void
  setSelectedStoreName: (s: string | null) => void
  setDiffFilterSource: (s: string | null) => void
  setDiffFilterResolved: (s: string | null) => void
  setTurnoverTimeRange: (r: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  dashboardKPI: mockDashboardKPI,
  storeMapPoints: mockStoreMapPoints,
  turnoverTrends: mockTurnoverTrends,
  materialHeatmap: mockMaterialHeatmap,
  vehicleList: mockVehicleList,
  vehicleDetail: mockVehicleDetail,
  diffSummary: mockDiffSummary,
  diffRecords: mockDiffRecords,
  turnoverComparisons: mockTurnoverComparisons,
  turnoverGapSamples: mockTurnoverGapSamples,
  selectedVehicleId: null,
  selectedMaterialType: null,
  selectedStoreName: null,
  diffFilterSource: null,
  diffFilterResolved: null,
  turnoverTimeRange: "12m",
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedMaterialType: (t) => set({ selectedMaterialType: t }),
  setSelectedStoreName: (s) => set({ selectedStoreName: s }),
  setDiffFilterSource: (s) => set({ diffFilterSource: s }),
  setDiffFilterResolved: (s) => set({ diffFilterResolved: s }),
  setTurnoverTimeRange: (r) => set({ turnoverTimeRange: r }),
}))
