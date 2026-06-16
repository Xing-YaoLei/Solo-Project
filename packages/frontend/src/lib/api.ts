import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const followUpApi = {
  getMyTasks: (params?: Record<string, string>) =>
    api.get('/follow-up-tasks/my-tasks', { params }),
  getTaskDetail: (id: string) =>
    api.get(`/follow-up-tasks/${id}`),
  updateTaskStatus: (id: string, status: string) =>
    api.patch(`/follow-up-tasks/${id}/status`, { status }),
  addReviewNote: (id: string, data: { type: string; content: string }) =>
    api.post(`/follow-up-tasks/${id}/notes`, data),
  submitPharmacistOpinion: (id: string, data: { opinion: string; isApproved: boolean }) =>
    api.post(`/follow-up-tasks/${id}/pharmacist-opinion`, data),
  submitBatchExpiry: (id: string, data: { batchNo: string; productionDate: string; expiryDate: string; shelfLife: string }) =>
    api.post(`/follow-up-tasks/${id}/batch-expiry`, data),
  getAllTasks: (params?: Record<string, string>) =>
    api.get('/follow-up-tasks', { params }),
};

export const replenishmentApi = {
  getOrders: (params?: Record<string, string>) =>
    api.get('/replenishment-orders', { params }),
  getOrderDetail: (id: string) =>
    api.get(`/replenishment-orders/${id}`),
  createFromOrder: (orderId: string) =>
    api.post(`/replenishment-orders/${orderId}/create-follow-up`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTrend: (period?: string) => api.get('/dashboard/trend', { params: { period } }),
};

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};
