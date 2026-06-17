import { create } from 'zustand'

type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING'

interface AppState {
  currentShift: Shift
  setCurrentShift: (shift: Shift) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentShift: 'MORNING',
  setCurrentShift: (shift) => set({ currentShift: shift }),
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
