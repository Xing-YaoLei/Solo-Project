import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const token = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isAuthenticated = computed(() => !!token.value)

  const setUser = (userData: any) => {
    user.value = userData
  }

  const setTokens = (access: string, refresh: string) => {
    token.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  const logout = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  const login = async (username: string, password: string) => {
    const api = useApi()
    try {
      const response = await api.post('/auth/users/login/', { username, password })
      const { access, refresh, user: userData } = response.data
      setTokens(access, refresh)
      setUser(userData)
      return userData
    } catch (error) {
      throw error
    }
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return null
    const api = useApi()
    try {
      const response = await api.get('/auth/users/me/')
      setUser(response.data)
      return response.data
    } catch (error) {
      logout()
      throw error
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setTokens,
    logout,
    login,
    fetchCurrentUser,
  }
})
