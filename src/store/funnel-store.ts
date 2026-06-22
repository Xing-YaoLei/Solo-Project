import { create } from "zustand"
import type { FunnelStage, FunnelStageKey } from "@/lib/types"

interface FunnelFilters {
  startDate: string | null
  endDate: string | null
  department: string | null
}

interface FunnelState {
  stages: FunnelStage[]
  firstResolutionRate: number
  firstResolutionTrend: Array<{ month: string; rate: number }>
  filters: FunnelFilters
  selectedStage: FunnelStageKey | null
  setStages: (stages: FunnelStage[]) => void
  setFirstResolutionRate: (rate: number) => void
  setFirstResolutionTrend: (trend: Array<{ month: string; rate: number }>) => void
  setFilters: (filters: Partial<FunnelFilters>) => void
  setSelectedStage: (stage: FunnelStageKey | null) => void
  reset: () => void
}

const initialFilters: FunnelFilters = {
  startDate: null,
  endDate: null,
  department: null,
}

export const useFunnelStore = create<FunnelState>((set) => ({
  stages: [],
  firstResolutionRate: 0,
  firstResolutionTrend: [],
  filters: initialFilters,
  selectedStage: null,
  setStages: (stages) => set({ stages }),
  setFirstResolutionRate: (rate) => set({ firstResolutionRate: rate }),
  setFirstResolutionTrend: (trend) => set({ firstResolutionTrend: trend }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSelectedStage: (stage) => set({ selectedStage: stage }),
  reset: () =>
    set({
      stages: [],
      firstResolutionRate: 0,
      firstResolutionTrend: [],
      filters: initialFilters,
      selectedStage: null,
    }),
}))
