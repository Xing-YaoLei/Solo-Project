import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  phone?: string
  department?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      },
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface AppState {
  sidebarCollapsed: boolean
  currentView: string
  viewRole: string
  toggleSidebar: () => void
  setCurrentView: (view: string) => void
  setViewRole: (role: string) => void
}

const viewRoleMap: Record<string, string> = {
  manager: 'PROPERTY_MANAGER',
  maintenance: 'MAINTENANCE_WORKER',
  finance: 'FINANCE',
  tenant: 'TENANT',
  frontline: 'FRONTLINE',
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      currentView: 'manager',
      viewRole: 'PROPERTY_MANAGER',
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCurrentView: (view) => set({ currentView: view, viewRole: viewRoleMap[view] || view }),
      setViewRole: (role) => set({ viewRole: role }),
    }),
    {
      name: 'app-storage',
    }
  )
)

interface TaskFilters {
  status?: string
  type?: string
  priority?: string
  assigneeId?: string
  propertyId?: string
  keyword?: string
  pool?: string
}

interface TaskState {
  filters: TaskFilters
  selectedTaskId: string | null
  setFilters: (filters: Partial<TaskFilters>) => void
  resetFilters: () => void
  setSelectedTask: (id: string | null) => void
}

export const useTaskStore = create<TaskState>((set) => ({
  filters: {},
  selectedTaskId: null,
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: {} }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
}))
