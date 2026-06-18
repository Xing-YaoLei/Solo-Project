import { defineStore } from 'pinia'
import type { UserSummary } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserSummary | null,
    token: '' as string,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isManager: (state) => state.user?.role === 'manager',
    isFinance: (state) => state.user?.role === 'finance',
    userId: (state): number | null => {
      if (!state.user?.id) return null
      const n = Number(state.user.id)
      return isNaN(n) ? null : n
    },
  },
  actions: {
    init() {
      const tokenCookie = useCookie('token')
      if (tokenCookie.value && !this.token) {
        this.token = tokenCookie.value
        this.loadUserFromToken()
      }
    },
    async loadUserFromToken() {
      if (!this.token) return
      try {
        const base64Url = this.token.split('.')[1]
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
          if (payload.user_id && payload.username) {
            this.user = {
              id: String(payload.user_id),
              username: payload.username,
              role: payload.role || 'specialist',
            }
          }
        }
      } catch {}
    },
    setUser(user: UserSummary) {
      this.user = user
    },
    setToken(token: string) {
      this.token = token
      const tokenCookie = useCookie('token')
      tokenCookie.value = token
      this.loadUserFromToken()
    },
    logout() {
      this.user = null
      this.token = ''
      const tokenCookie = useCookie('token')
      tokenCookie.value = null
      navigateTo('/login')
    },
  },
})
