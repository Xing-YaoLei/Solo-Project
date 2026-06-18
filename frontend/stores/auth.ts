import { defineStore } from 'pinia'
import type { UserInfo, LoginResponse } from '~/types'

const TOKEN_KEY = 'cardealer_token'
const REFRESH_KEY = 'cardealer_refresh'
const USER_KEY = 'cardealer_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: (typeof localStorage.getItem(TOKEN_KEY) as string | null),
    refreshToken: (typeof localStorage.getItem(REFRESH_KEY) as string | null),
    user: (JSON.parse(localStorage.getItem(USER_KEY) || 'null') as UserInfo | null,
  }),
  getters: {
    isLoggedIn: (s => !!s.token && !!s.user,
    isAppraiser: (s => s.user?.role === 'appraiser' || s.user?.role === 'manager',
    isSales: (s => s.user?.role === 'sales' || s.user?.role === 'manager',
    isFinance: (s => s.user?.role === 'finance' || s.user?.role === 'manager',
    isManager: (s => s.user?.role === 'manager',
    role: (s => s.user?.role,
    hasPermission: (s) => (action: string) => {
      if (!s.user) return false
      if (s.user.role === 'manager') return true
      const perms = s.user.permissions || []
      if (perms.includes('*')) return true
      return perms.some(p => {
        if (p === action) return true
        const [m, a] = action.split(':')
        const [pm, pa] = p.split(':')
        return m === pm && (pa === '*' || a === pa)
      })
    },
  },
  actions: {
    async login(username: string, password: string) {
      const { $api } = useNuxtApp()
      const res = await $api.post<any, LoginResponse>('/auth/login', { username, password })
      this.setAuth(res)
      return res
    },
    setAuth(data: LoginResponse) {
      this.token = data.access
      this.refreshToken = data.refresh
      this.user = data.user
      localStorage.setItem(TOKEN_KEY, data.access)
      localStorage.setItem(REFRESH_KEY, data.refresh)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    },
    async logout() {
      try {
        const { $api } = useNuxtApp()
        if (this.refreshToken) {
          await $api.post('/auth/logout', { refresh: this.refreshToken })
        }
      } catch { /* ignore */ }
      this.clearAuth()
    },
    clearAuth() {
      this.token = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(REFRESH_KEY)
    },
    async refreshProfile() {
      try {
        const { $api } = useNuxtApp()
        const profile = await $api.get<any, UserInfo>('/auth/profile')
        this.user = profile
        localStorage.setItem(USER_KEY, JSON.stringify(profile))
      } catch { /* ignore */ }
    },
  },
})
