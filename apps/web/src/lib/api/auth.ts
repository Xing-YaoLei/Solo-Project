import axiosInstance from '../axios';
import type { User } from '@scenic/shared';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return axiosInstance.post('/api/auth/login', data);
}

export async function logout(): Promise<void> {
  return axiosInstance.post('/api/auth/logout');
}

export async function getCurrentUser(): Promise<User> {
  return axiosInstance.get('/api/auth/me');
}
