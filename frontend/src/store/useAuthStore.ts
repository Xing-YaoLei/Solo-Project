import { create } from 'zustand'
import type { User, UserRole } from '../types'
import { authApi } from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await authApi.login({ username, password })
      const token = res.data.access_token
      localStorage.setItem('token', token)
      set({ token })

      const meRes = await authApi.getMe()
      const user = meRes.data
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const res = await authApi.getMe()
      const user = res.data
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    } catch {
      get().logout()
    }
  },

  hasRole: (...roles: UserRole[]) => {
    const user = get().user
    if (!user) return false
    return roles.includes(user.role)
  },
}))
