import { create } from 'zustand'

interface UserInfo {
  id: number
  name: string
  role: string
}

interface AppState {
  user: UserInfo | null
  setUser: (user: UserInfo | null) => void
  currentOperator: string
  setCurrentOperator: (operator: string) => void
  collapsed: boolean
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: { id: 1, name: '管理员', role: 'admin' },
  setUser: (user) => set({ user }),
  currentOperator: '管理员',
  setCurrentOperator: (operator) => set({ currentOperator: operator }),
  collapsed: false,
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setCollapsed: (collapsed) => set({ collapsed }),
}))
