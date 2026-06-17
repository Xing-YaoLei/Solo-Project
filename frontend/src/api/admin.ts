import api from './client';
import type { DashboardStats, DispatchRule } from '@/types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getDispatchRules = async (params: {
  skip?: number;
  limit?: number;
}): Promise<{ items: DispatchRule[]; total: number }> => {
  const response = await api.get('/dispatch-rules', { params });
  return response.data;
};

export const createDispatchRule = async (
  data: Partial<DispatchRule>
): Promise<DispatchRule> => {
  const response = await api.post('/dispatch-rules', data);
  return response.data;
};

export const updateDispatchRule = async (
  id: number,
  data: Partial<DispatchRule>
): Promise<DispatchRule> => {
  const response = await api.put(`/dispatch-rules/${id}`, data);
  return response.data;
};

export const deleteDispatchRule = async (id: number): Promise<void> => {
  await api.delete(`/dispatch-rules/${id}`);
};
