import axiosInstance from '../axios';
import type { Department } from '@scenic/shared';

export async function getDepartments(): Promise<Department[]> {
  return axiosInstance.get('/api/departments');
}

export async function createDepartment(
  data: Omit<Department, 'id' | 'createdAt'>
): Promise<Department> {
  return axiosInstance.post('/api/departments', data);
}

export async function updateDepartment(
  id: string,
  data: Partial<Department>
): Promise<Department> {
  return axiosInstance.put(`/api/departments/${id}`, data);
}

export async function deleteDepartment(id: string): Promise<void> {
  return axiosInstance.delete(`/api/departments/${id}`);
}
