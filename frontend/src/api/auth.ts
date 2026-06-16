import api from './client'

export interface User {
  id: number
  username: string
  full_name: string
  email?: string
  role: string
  is_active: boolean
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  login: (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    return api.post<LoginResponse>('/auth/login', formData)
  },

  register: (data: { username: string; password: string; full_name: string; email?: string; role?: string }) => {
    return api.post<User>('/auth/register', data)
  },

  getMe: () => {
    return api.get<User>('/auth/me')
  },
}
