import request from './request'
import type {
  LoginRequest,
  LoginResponse,
  User,
  UserCreate,
  UserUpdate,
  UserQuery,
  PagedResult,
} from '@/types'

export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/auth/login', data)
}

export const getCurrentUser = (): Promise<User> => {
  return request.get('/auth/me')
}

export const getUsers = (params: UserQuery): Promise<PagedResult<User>> => {
  return request.get('/users', { params })
}

export const getUserById = (id: number): Promise<User> => {
  return request.get(`/users/${id}`)
}

export const createUser = (data: UserCreate): Promise<User> => {
  return request.post('/users', data)
}

export const updateUser = (id: number, data: UserUpdate): Promise<void> => {
  return request.put(`/users/${id}`, data)
}

export const deleteUser = (id: number): Promise<void> => {
  return request.delete(`/users/${id}`)
}
