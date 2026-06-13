import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { authApi } from '@/api'

interface AuthState {
  token: string | null
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: async (username: string, password: string) => {
        const res = await authApi.login(username, password)
        set({ token: res.access_token })
        await get().fetchMe()
      },
      logout: () => {
        set({ token: null, user: null })
      },
      fetchMe: async () => {
        if (!get().token) return
        const user = await authApi.me()
        set({ user })
      },
    }),
    {
      name: 'coldchain-auth',
      partialize: (state) => ({ token: state.token }),
    },
  ),
)
