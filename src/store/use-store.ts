import { create } from 'zustand'
import type { Role } from '@/lib/types'

interface AppState {
  currentRole: Role
  currentDepartment: string | null
  currentAdvisor: string | null
  lastRefreshedAt: string
  shareModalOpen: boolean
  setCurrentRole: (role: Role) => void
  setCurrentDepartment: (dept: string | null) => void
  setCurrentAdvisor: (adv: string | null) => void
  setLastRefreshedAt: (timestamp: string) => void
  refreshData: () => void
  toggleShareModal: () => void
}

export const useStore = create<AppState>((set) => ({
  currentRole: 'admin',
  currentDepartment: null,
  currentAdvisor: null,
  lastRefreshedAt: new Date().toISOString(),
  shareModalOpen: false,
  setCurrentRole: (role) => set({ currentRole: role, currentDepartment: null, currentAdvisor: null }),
  setCurrentDepartment: (dept) => set({ currentDepartment: dept }),
  setCurrentAdvisor: (adv) => set({ currentAdvisor: adv }),
  setLastRefreshedAt: (timestamp) => set({ lastRefreshedAt: timestamp }),
  refreshData: () => set({ lastRefreshedAt: new Date().toISOString() }),
  toggleShareModal: () => set((s) => ({ shareModalOpen: !s.shareModalOpen })),
}))
