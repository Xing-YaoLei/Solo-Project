import { api } from './axios'
import { LoginDto, RegisterDto, AuthResponseDto, User } from '@/types/auth'

export const authApi = {
  login: (data: LoginDto) => 
    api.post<AuthResponseDto>('/auth/login', data),
  
  register: (data: RegisterDto) => 
    api.post<AuthResponseDto>('/auth/register', data),
  
  getCurrentUser: () => 
    api.get<User>('/auth/me'),
  
  logout: () => 
    api.post<void>('/auth/logout'),
  
  getUsersByRole: (role?: string) => 
    api.get<User[]>('/auth/users', { params: { role } }),
}
