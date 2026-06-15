import { defineStore } from 'pinia'
import type { Student } from '~/types'

interface AuthState {
  token: string
  user: Student | null
  isLoggedIn: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
    user: null,
    isLoggedIn: false,
  }),
  actions: {
    setToken(token: string) {
      this.token = token
      this.isLoggedIn = !!token
      if (import.meta.client) {
        localStorage.setItem('auth_token', token)
      }
    },
    setUser(user: Student) {
      this.user = user
    },
    async login(username: string, _password: string) {
      const mockToken = 'mock_jwt_token_' + Date.now()
      this.setToken(mockToken)
      this.setUser({
        id: '1',
        name: username || '管理员',
        class: '管理组',
        phone: '13800138000',
        enrollDate: '2024-01-01',
        status: '在读',
      })
    },
    logout() {
      this.token = ''
      this.user = null
      this.isLoggedIn = false
      if (import.meta.client) {
        localStorage.removeItem('auth_token')
      }
    },
    initAuth() {
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        if (token) {
          this.setToken(token)
          this.setUser({
            id: '1',
            name: '管理员',
            class: '管理组',
            phone: '13800138000',
            enrollDate: '2024-01-01',
            status: '在读',
          })
        }
      }
    },
  },
})
