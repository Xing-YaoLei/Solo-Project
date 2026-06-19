import api from '../utils/request';

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const performanceApi = {
  getList: (params: any) => api.get<PageResult<any>>('/performances', { params }),
  findById: (id: number) => api.get(`/performances/${id}`),
  create: (data: any) => api.post('/performances', data),
  update: (id: number, data: any) => api.put(`/performances/${id}`, data),
  delete: (id: number, operatorId?: number) => api.delete(`/performances/${id}`, { params: { operatorId } }),
};

export const taskApi = {
  getList: (params: any) => api.get<PageResult<any>>('/tasks', { params }),
  getBoard: (scheduleId: number) => api.get(`/tasks/board/${scheduleId}`),
  findById: (id: number) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data),
  assign: (id: number, data: any) => api.put(`/tasks/${id}/assign`, data),
  updateStatus: (id: number, data: any) => api.put(`/tasks/${id}/status`, data),
  delete: (id: number, operatorId?: number) => api.delete(`/tasks/${id}`, { params: { operatorId } }),
};

export const orderApi = {
  getList: (params: any) => api.get<PageResult<any>>('/orders', { params }),
  findById: (id: number) => api.get(`/orders/${id}`),
  getChangeLogs: (id: number) => api.get(`/orders/${id}/change-logs`),
  create: (data: any) => api.post('/orders', data),
  update: (id: number, data: any) => api.put(`/orders/${id}`, data),
  updateStatus: (id: number, data: any) => api.put(`/orders/${id}/status`, data),
};

export const sponsorApi = {
  getList: (params: any) => api.get<PageResult<any>>('/sponsors', { params }),
  getStats: (scheduleId?: number) => api.get('/sponsors/stats', { params: { scheduleId } }),
  findById: (id: number) => api.get(`/sponsors/${id}`),
  create: (data: any) => api.post('/sponsors', data),
  update: (id: number, data: any) => api.put(`/sponsors/${id}`, data),
  delete: (id: number, operatorId?: number) => api.delete(`/sponsors/${id}`, { params: { operatorId } }),
};

export const ticketApi = {
  getList: (params: any) => api.get<PageResult<any>>('/ticket-types', { params }),
  getStats: (scheduleId?: number) => api.get('/ticket-types/stats', { params: { scheduleId } }),
  findById: (id: number) => api.get(`/ticket-types/${id}`),
  create: (data: any) => api.post('/ticket-types', data),
  update: (id: number, data: any) => api.put(`/ticket-types/${id}`, data),
  delete: (id: number, operatorId?: number) => api.delete(`/ticket-types/${id}`, { params: { operatorId } }),
};

export const verificationApi = {
  getList: (params: any) => api.get<PageResult<any>>('/verifications', { params }),
  getStats: (params: any) => api.get('/verifications/stats', { params }),
  findById: (id: number) => api.get(`/verifications/${id}`),
  verify: (data: any) => api.post('/verifications', data),
};

export const disputeApi = {
  getList: (params: any) => api.get<PageResult<any>>('/disputes', { params }),
  getStats: (params: any) => api.get('/disputes/stats', { params }),
  findById: (id: number) => api.get(`/disputes/${id}`),
  getLogs: (id: number) => api.get(`/disputes/${id}/logs`),
  create: (data: any) => api.post('/disputes', data),
  updateStatus: (id: number, data: any) => api.put(`/disputes/${id}/status`, data),
  assignHandler: (id: number, data: any) => api.put(`/disputes/${id}/assign`, data),
  resolve: (id: number, data: any) => api.put(`/disputes/${id}/resolve`, data),
  close: (id: number, data: any) => api.put(`/disputes/${id}/close`, data),
  addLog: (id: number, data: any) => api.post(`/disputes/${id}/logs`, data),
};

export const recordApi = {
  getBySchedule: (scheduleId: number) => api.get(`/records/schedule/${scheduleId}`),
  getOverview: (params?: { startDate?: string; endDate?: string }) => api.get('/records/overview', { params }),
};

export const systemLogApi = {
  getList: (params: any) => api.get<PageResult<any>>('/system-logs', { params }),
  getByRelated: (relatedType: string, relatedId: number) => api.get(`/system-logs/related/${relatedType}/${relatedId}`),
  create: (data: any) => api.post('/system-logs', data),
};

export const notificationApi = {
  getByUser: (userId: number, params?: any) => api.get(`/notifications/user/${userId}`, { params }),
  getUnreadCount: (userId: number) => api.get(`/notifications/user/${userId}/unread-count`),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (userId: number) => api.put(`/notifications/user/${userId}/read-all`),
};

export const exportApi = {
  getRecords: (params: any) => api.get<PageResult<any>>('/exports', { params }),
  exportVerifications: (data: any) => api.post('/exports/verifications', data, { responseType: 'blob' }),
  exportSponsors: (data: any) => api.post('/exports/sponsors', data, { responseType: 'blob' }),
  exportReview: (data: any) => api.post('/exports/review', data, { responseType: 'blob' }),
};

export const reviewApi = {
  getMonthly: (year: number, month: number) => api.get('/reviews/monthly', { params: { year, month } }),
  getTrend: (months?: number) => api.get('/reviews/trend', { params: { months } }),
};

export const userApi = {
  getList: (params: any) => api.get<PageResult<any>>('/users', { params }),
  findById: (id: number) => api.get(`/users/${id}`),
  getByRole: (role: string) => api.get(`/users/role/${role}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};
