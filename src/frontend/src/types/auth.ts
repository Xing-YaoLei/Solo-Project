import { UserRole } from './enums'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  phoneNumber?: string
  createdAt: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  fullName: string
  phoneNumber?: string
  role: UserRole
}

export interface AuthResponseDto {
  token: string
  userId: string
  email: string
  fullName: string
  role: UserRole
  expiresAt: string
}
