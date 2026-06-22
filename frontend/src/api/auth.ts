import apiClient from './client'
import { LoginData, TokenResponse, User } from '../types'

export const authApi = {
  login: async (data: LoginData): Promise<TokenResponse> => {
    const formData = new FormData()
    formData.append('username', data.username)
    formData.append('password', data.password)
    const res = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  register: async (data: { username: string; email: string; password: string; role: string }): Promise<User> => {
    const res = await apiClient.post('/auth/register', data)
    return res.data
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me')
    return res.data
  },

  logout: (): void => {
    localStorage.removeItem('audit_token')
    localStorage.removeItem('audit_user')
  },
}
