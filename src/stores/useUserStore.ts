import { create } from 'zustand'
import type { User } from '@/types/training'

type UserRole = 'student' | 'admin'

interface UserState {
  user: User | null
  role: UserRole | null
  login: (userData: User) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  role: null,
  login: (userData) => {
    localStorage.setItem('bnb_user', JSON.stringify(userData))
    set({ user: userData, role: userData.role as UserRole })
  },
  logout: () => {
    localStorage.removeItem('bnb_user')
    set({ user: null, role: null })
  },
}))
