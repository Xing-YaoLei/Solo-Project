import { create } from 'zustand'
import type { User, UserRole } from '@/types'

export interface AuthState {
  currentUser: User | null
  currentRole: UserRole
  setCurrentUser: (user: User) => void
  setRole: (role: UserRole) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: {
    id: 'op_zhangsan',
    username: 'op_zhangsan',
    display_name: '张三',
    role: 'operator',
    city_code: 'BJ',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  currentRole: 'operator',
  setCurrentUser: (user) => set({ currentUser: user }),
  setRole: (role) => set({ currentRole: role }),
}))
