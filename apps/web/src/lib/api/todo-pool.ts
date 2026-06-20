import axiosInstance from '../axios';
import type { Complaint } from '@scenic/shared';

export async function getOverdueTasks(): Promise<Complaint[]> {
  return axiosInstance.get('/api/todo-pool/overdue');
}

export async function getSupplementingTasks(): Promise<Complaint[]> {
  return axiosInstance.get('/api/todo-pool/supplement');
}

export async function getRejectedTasks(): Promise<Complaint[]> {
  return axiosInstance.get('/api/todo-pool/rejected');
}
