import axios from 'axios';
import type { User, Order, OrderListResponse, DispatchRule, FirstTimeResolutionStats, Token, ProcessRecord, ReviewSupplement, OrderStatus, AttachmentBase } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post<Token>('/auth/login', formData);
  },
  getCurrentUser: () => api.get<User>('/auth/me'),
  register: (data: any) => api.post<User>('/auth/register', data),
};

export const orderAPI = {
  list: (params: {
    status?: OrderStatus;
    assignee_id?: number;
    creator_id?: number;
    priority?: number;
    audit_type?: string;
    keyword?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }) => api.get<OrderListResponse>('/orders', { params }),

  get: (id: number) => api.get<Order>(`/orders/${id}`),

  create: (data: any) => api.post<Order>('/orders', data),

  update: (id: number, data: any) => api.put<Order>(`/orders/${id}`, data),

  process: (id: number, data: { action: string; new_status: OrderStatus; remark?: string; attachments?: AttachmentBase[] }) =>
    api.post<Order>(`/orders/${id}/process`, data),

  reviewFailed: (id: number, data: {
    affected_objects: any[];
    supplement?: string;
    new_assignee_id?: number;
  }) => api.post<Order>(`/orders/${id}/review-failed`, { order_id: id, ...data }),

  addSupplement: (id: number, data: any) =>
    api.post<ReviewSupplement>(`/orders/${id}/supplement`, data),

  getRecords: (id: number) => api.get<ProcessRecord[]>(`/orders/${id}/records`),
};

export const userAPI = {
  list: (params?: { role?: string; department?: string; is_active?: boolean }) =>
    api.get<User[]>('/users', { params }),
  get: (id: number) => api.get<User>(`/users/${id}`),
  update: (id: number, data: any) => api.put<User>(`/users/${id}`, data),
};

export const dispatchRuleAPI = {
  list: (params?: { is_active?: boolean; department?: string }) =>
    api.get<DispatchRule[]>('/dispatch-rules', { params }),
  get: (id: number) => api.get<DispatchRule>(`/dispatch-rules/${id}`),
  create: (data: any) => api.post<DispatchRule>('/dispatch-rules', data),
  update: (id: number, data: any) => api.put<DispatchRule>(`/dispatch-rules/${id}`, data),
  delete: (id: number) => api.delete(`/dispatch-rules/${id}`),
};

export const analyticsAPI = {
  getFirstTimeResolution: (params?: { start_date?: string; end_date?: string }) =>
    api.get<FirstTimeResolutionStats>('/analytics/first-time-resolution', { params }),

  exportOrders: (filters: any) => api.post('/analytics/export', filters),

  getExportStatus: (taskId: string) => api.get(`/analytics/export/${taskId}`),
};

export const uploadAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
