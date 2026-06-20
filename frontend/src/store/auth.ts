import { create } from 'zustand'

export type UserRole = 'admin' | 'operation_manager' | 'analyst' | 'viewer'

interface UserInfo {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}

interface AuthState {
  token: string | null
  user: UserInfo | null
  setAuth: (token: string, user: UserInfo) => void
  logout: () => void
  isAuthenticated: () => boolean
  hasRole: (...roles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: JSON.parse(localStorage.getItem('user_info') || 'null'),

  setAuth: (token: string, user: UserInfo) => {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user_info', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    set({ token: null, user: null })
  },

  isAuthenticated: () => !!get().token,

  hasRole: (...roles: UserRole[]) => {
    const user = get().user
    if (!user) return false
    if (user.role === 'admin') return true
    return roles.includes(user.role)
  },
}))
