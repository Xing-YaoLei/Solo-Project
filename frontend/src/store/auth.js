import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: '', user: null, isAuthenticated: false })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))
