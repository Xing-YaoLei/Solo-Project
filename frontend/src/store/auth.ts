import { create } from 'zustand'
import type { User, UserRole } from '../types'
import { authApi } from '../api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true })
    try {
      const res = await authApi.login({ username, password })
      localStorage.setItem('access_token', res.access_token)
      set({ token: res.access_token, isAuthenticated: true })
      await useAuthStore.getState().fetchMe()
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchMe: async () => {
    try {
      const user = await authApi.getMe()
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    } catch {
      useAuthStore.getState().logout()
    }
  },

  setUser: (user: User) => {
    set({ user })
    localStorage.setItem('user', JSON.stringify(user))
  },
}))

export const hasRole = (user: User | null, ...roles: UserRole[]): boolean => {
  if (!user) return false
  return roles.includes(user.role)
}
