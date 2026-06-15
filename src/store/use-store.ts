import { create } from 'zustand'
import type { Role } from '@/lib/types'

interface AppState {
  currentRole: Role
  lastRefreshedAt: string
  shareModalOpen: boolean
  setCurrentRole: (role: Role) => void
  setLastRefreshedAt: (timestamp: string) => void
  refreshData: () => void
  toggleShareModal: () => void
}

export const useStore = create<AppState>((set) => ({
  currentRole: 'admin',
  lastRefreshedAt: new Date().toISOString(),
  shareModalOpen: false,
  setCurrentRole: (role) => set({ currentRole: role }),
  setLastRefreshedAt: (timestamp) => set({ lastRefreshedAt: timestamp }),
  refreshData: () => set({ lastRefreshedAt: new Date().toISOString() }),
  toggleShareModal: () => set((s) => ({ shareModalOpen: !s.shareModalOpen })),
}))
