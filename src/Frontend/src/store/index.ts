import { create } from 'zustand'
import type { StaffDto, MoveOutOrderListDto, TodoTaskDto } from '@/types'

interface UserState {
  user: StaffDto | null
  token: string | null
  setUser: (user: StaffDto | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

interface AppState {
  loading: boolean
  collapsed: boolean
  selectedOrder: MoveOutOrderListDto | null
  selectedTodo: TodoTaskDto | null
  staffList: StaffDto[]
  setLoading: (loading: boolean) => void
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
  setSelectedOrder: (order: MoveOutOrderListDto | null) => void
  setSelectedTodo: (todo: TodoTaskDto | null) => void
  setStaffList: (staff: StaffDto[]) => void
}

type StoreState = UserState & AppState

export const useStore = create<StoreState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  loading: false,
  collapsed: false,
  selectedOrder: null,
  selectedTodo: null,
  staffList: [],
  setLoading: (loading) => set({ loading }),
  setCollapsed: (collapsed) => set({ collapsed }),
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  setSelectedOrder: (selectedOrder) => set({ selectedOrder }),
  setSelectedTodo: (selectedTodo) => set({ selectedTodo }),
  setStaffList: (staffList) => set({ staffList }),
}))

export const useUserStore = () => {
  const { user, token, setUser, setToken, logout } = useStore()
  return { user, token, setUser, setToken, logout }
}

export const useAppStore = () => {
  const {
    loading,
    collapsed,
    selectedOrder,
    selectedTodo,
    staffList,
    setLoading,
    setCollapsed,
    toggleCollapsed,
    setSelectedOrder,
    setSelectedTodo,
    setStaffList,
  } = useStore()
  return {
    loading,
    collapsed,
    selectedOrder,
    selectedTodo,
    staffList,
    setLoading,
    setCollapsed,
    toggleCollapsed,
    setSelectedOrder,
    setSelectedTodo,
    setStaffList,
  }
}

export default useStore
