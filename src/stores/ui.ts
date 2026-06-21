import { create } from 'zustand'

interface SavedFilter {
  id: string
  name: string
  pageKey: string
  filters: Record<string, string>
  createdAt: string
}

interface UIState {
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  savedFilters: SavedFilter[]
  toggleSidebar: () => void
  setSidebarPinned: (pinned: boolean) => void
  saveFilter: (pageKey: string, name: string, filters: Record<string, string>) => void
  deleteFilter: (filterId: string) => void
  loadFilters: (pageKey: string) => SavedFilter[]
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  sidebarPinned: false,
  savedFilters: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarPinned: (pinned) => set({ sidebarPinned: pinned }),
  saveFilter: (pageKey, name, filters) => {
    const newFilter: SavedFilter = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      pageKey,
      filters,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ savedFilters: [...s.savedFilters, newFilter] }))
  },
  deleteFilter: (filterId) => {
    set((s) => ({ savedFilters: s.savedFilters.filter((f) => f.id !== filterId) }))
  },
  loadFilters: (pageKey) => {
    return get().savedFilters.filter((f) => f.pageKey === pageKey)
  },
}))
