import { create } from 'zustand'
import type { User, UserRole } from '@/types'

interface UserStore {
  user: User | null
  token: string
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
}

export const useUserStore = create<UserStore>((set, get) => {
  const savedToken = localStorage.getItem('token') || ''
  const savedUser = localStorage.getItem('user')
  const parsedUser = savedUser ? JSON.parse(savedUser) : null

  return {
    user: parsedUser,
    token: savedToken,
    setUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    },
    setToken: (token) => {
      localStorage.setItem('token', token)
      set({ token })
    },
    logout: () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: '' })
    },
    hasRole: (role) => {
      const { user } = get()
      if (!user) return false
      if (Array.isArray(role)) {
        return role.includes(user.role)
      }
      return user.role === role
    },
  }
})
