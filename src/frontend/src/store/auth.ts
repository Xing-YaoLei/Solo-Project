import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole, type AuthResponseDto, type User } from '@/types'
import { authApi } from '@/api'

interface AuthState {
  token: string | null
  user: User | null
  userId: string | null
  email: string | null
  fullName: string | null
  role: UserRole | null
  expiresAt: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; fullName: string; phoneNumber?: string; role: UserRole }) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  setAuthData: (data: AuthResponseDto) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      userId: null,
      email: null,
      fullName: null,
      role: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      setAuthData: (data: AuthResponseDto) => {
        set({
          token: data.token,
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          expiresAt: data.expiresAt,
          isAuthenticated: true,
        })
        localStorage.setItem('token', data.token)
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login({ email, password })
          set({
            token: response.token,
            userId: response.userId,
            email: response.email,
            fullName: response.fullName,
            role: response.role,
            expiresAt: response.expiresAt,
            isAuthenticated: true,
            isLoading: false,
          })
          localStorage.setItem('token', response.token)
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const response = await authApi.register(data)
          set({
            token: response.token,
            userId: response.userId,
            email: response.email,
            fullName: response.fullName,
            role: response.role,
            expiresAt: response.expiresAt,
            isAuthenticated: true,
            isLoading: false,
          })
          localStorage.setItem('token', response.token)
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          userId: null,
          email: null,
          fullName: null,
          role: null,
          expiresAt: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('token')
      },

      fetchCurrentUser: async () => {
        try {
          const user = await authApi.getCurrentUser()
          set({ user })
        } catch (error) {
          console.error('Failed to fetch current user:', error)
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        email: state.email,
        fullName: state.fullName,
        role: state.role,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
