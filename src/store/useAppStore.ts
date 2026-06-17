import { create } from 'zustand'
import type { ViewFilters, SavedView, DrilldownLevel } from '@/types'

interface AppState {
  activeView: string
  viewFilters: ViewFilters
  savedViews: SavedView[]
  selectedPatientId: string | null
  selectedPrescriptionId: string | null
  drilldownLevel: DrilldownLevel
  morningMeetingMode: boolean

  setViewFilters: (filters: Partial<ViewFilters>) => void
  saveView: (view: SavedView) => void
  loadView: (id: string) => void
  deleteView: (id: string) => void
  toggleMorningMeetingMode: () => void
  setDrilldownLevel: (level: DrilldownLevel) => void
  setSelectedPatientId: (id: string | null) => void
  setSelectedPrescriptionId: (id: string | null) => void
}

const defaultFilters: ViewFilters = {
  dateRange: [
    '2025-01-01',
    '2025-12-31',
  ],
}

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'overview',
  viewFilters: defaultFilters,
  savedViews: [],
  selectedPatientId: null,
  selectedPrescriptionId: null,
  drilldownLevel: { level: 'assessment', label: '评估量表' },
  morningMeetingMode: false,

  setViewFilters: (filters) =>
    set((state) => ({
      viewFilters: { ...state.viewFilters, ...filters },
    })),

  saveView: (view) =>
    set((state) => ({
      savedViews: [...state.savedViews, view],
    })),

  loadView: (id) => {
    const view = get().savedViews.find((v) => v.id === id)
    if (view) {
      set({ viewFilters: view.filters })
    }
  },

  deleteView: (id) =>
    set((state) => ({
      savedViews: state.savedViews.filter((v) => v.id !== id),
    })),

  toggleMorningMeetingMode: () =>
    set((state) => ({ morningMeetingMode: !state.morningMeetingMode })),

  setDrilldownLevel: (level) => set({ drilldownLevel: level }),

  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  setSelectedPrescriptionId: (id) => set({ selectedPrescriptionId: id }),
}))
