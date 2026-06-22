import { useState, useEffect, useCallback } from 'react'
import { User, LoginData } from '../types'
import { authApi } from '../api/auth'

const TOKEN_KEY = 'audit_token'
const USER_KEY = 'audit_user'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (data: LoginData) => {
    const res = await authApi.login(data)
    setToken(res.accessToken)
    setUser(res.user)
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    return res
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = () => !!token && !!user

  const hasRole = (role: string) => user?.role === role

  return {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  }
}
