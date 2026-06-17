import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => api.get('/auth/me'),
};

export const usersApi = {
  list: (params?: { role?: string; is_active?: boolean }) =>
    api.get('/users', { params }),
  getCleaners: () => api.get('/users/cleaners'),
  get: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
};

export const apartmentsApi = {
  list: (params?: { search?: string; building?: string }) =>
    api.get('/apartments', { params }),
  get: (id: number) => api.get(`/apartments/${id}`),
  create: (data: any) => api.post('/apartments', data),
  update: (id: number, data: any) => api.put(`/apartments/${id}`, data),
};

export const timeSlotsApi = {
  list: () => api.get('/time-slots'),
  get: (id: number) => api.get(`/time-slots/${id}`),
  create: (data: any) => api.post('/time-slots', data),
};

export const schedulesApi = {
  list: (params?: any) => api.get('/schedules', { params }),
  calendar: (params: { date_from: string; date_to: string; cleaner_id?: number }) =>
    api.get('/schedules/calendar', { params }),
  get: (id: number) => api.get(`/schedules/${id}`),
  create: (data: any) => api.post('/schedules', data),
  update: (id: number, data: any) => api.put(`/schedules/${id}`, data),
  checkConflicts: (data: any) => api.post('/schedules/check-conflicts', data),
  updateStatus: (id: number, status: string) =>
    api.post(`/schedules/${id}/status/${status}`),
  reschedule: (id: number, data: any) =>
    api.post(`/schedules/${id}/reschedule`, data),
  getReschedules: (id: number) =>
    api.get(`/schedules/${id}/reschedules`),
  recordAttendance: (id: number, data: any) =>
    api.post(`/schedules/${id}/attendance`, data),
  getAttendance: (id: number) =>
    api.get(`/schedules/${id}/attendance`),
  markNoShow: (id: number) =>
    api.post(`/schedules/${id}/mark-no-show`),
};

export const detailsApi = {
  getConflicts: (scheduleId: number) =>
    api.get(`/details/${scheduleId}/conflicts`),
  getCommunications: (scheduleId: number) =>
    api.get(`/details/${scheduleId}/communications`),
  addCommunication: (scheduleId: number, data: any) =>
    api.post(`/details/${scheduleId}/communications`, data),
  getReviews: (scheduleId: number) =>
    api.get(`/details/${scheduleId}/reviews`),
  addReview: (scheduleId: number, data: any) =>
    api.post(`/details/${scheduleId}/reviews`, data),
  listUnresolvedConflicts: () =>
    api.get('/details/conflicts'),
  resolveConflict: (conflictId: number, data: any) =>
    api.put(`/details/conflicts/${conflictId}`, data),
  listCapacityRules: () =>
    api.get('/details/capacity-rules'),
  createCapacityRule: (data: any) =>
    api.post('/details/capacity-rules', data),
};

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getDailyStats: (params: { date_from: string; date_to: string }) =>
    api.get('/reports/daily-stats', { params }),
  getTodos: () => api.get('/reports/todos'),
};
