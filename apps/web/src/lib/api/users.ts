import axiosInstance from '../axios';
import type { User, UserRole } from '@scenic/shared';

export async function getUsers(params?: { role?: UserRole; departmentId?: string }): Promise<User[]> {
  return axiosInstance.get('/api/users', { params });
}

export async function getUserById(id: string): Promise<User> {
  return axiosInstance.get(`/api/users/${id}`);
}
