import axios from 'axios';
import type {
  AuthResponse,
  User,
  DietRecord,
  BodyMeasurement,
  CoachComment,
  CoachCommentHistory,
  MonthlyReview,
  CheckInInterruption,
  ExportRecord
} from '../types';
import type { MealType, ExportFormat } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
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

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (data: {
    userName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role: number;
    coachId?: number;
  }) => api.post<User>('/auth/register', data).then((r) => r.data),
  getCoaches: () => api.get<User[]>('/auth/coaches').then((r) => r.data),
  getClients: (coachId: number) =>
    api.get<User[]>(`/auth/coaches/${coachId}/clients`).then((r) => r.data)
};

export const dietRecordApi = {
  list: (userId: number, startDate?: string, endDate?: string) =>
    api
      .get<DietRecord[]>('/dietrecords', {
        params: { userId, startDate, endDate }
      })
      .then((r) => r.data),
  get: (id: number) => api.get<DietRecord>(`/dietrecords/${id}`).then((r) => r.data),
  create: (data: {
    userId: number;
    recordDate: string;
    mealType: MealType;
    foodItems: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    notes?: string;
    photoUrls?: string[];
  }) => api.post<DietRecord>('/dietrecords', data).then((r) => r.data),
  update: (id: number, data: any) =>
    api.put<DietRecord>(`/dietrecords/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/dietrecords/${id}`).then((r) => r.data)
};

export const bodyMeasurementApi = {
  list: (userId: number, startDate?: string, endDate?: string) =>
    api
      .get<BodyMeasurement[]>('/bodymeasurements', {
        params: { userId, startDate, endDate }
      })
      .then((r) => r.data),
  create: (data: any) =>
    api.post<BodyMeasurement>('/bodymeasurements', data).then((r) => r.data),
  update: (id: number, data: any) =>
    api.put<BodyMeasurement>(`/bodymeasurements/${id}`, data).then((r) => r.data)
};

export const coachCommentApi = {
  getByDietRecord: (dietRecordId: number) =>
    api.get<CoachComment>(`/coachcomments/diet-record/${dietRecordId}`).then((r) => r.data),
  getHistory: (commentId: number) =>
    api.get<CoachCommentHistory[]>(`/coachcomments/${commentId}/history`).then((r) => r.data),
  create: (data: { dietRecordId: number; coachId: number; comment: string }) =>
    api.post<CoachComment>('/coachcomments', data).then((r) => r.data),
  update: (id: number, comment: string, operatorId: number) =>
    api
      .put<CoachComment>(`/coachcomments/${id}`, { comment }, { params: { operatorId } })
      .then((r) => r.data)
};

export const reportApi = {
  monthlyReview: (userId: number, year: number, month: number) =>
    api
      .get<MonthlyReview>('/reports/monthly-review', {
        params: { userId, year, month }
      })
      .then((r) => r.data)
};

export const exportApi = {
  export: (data: {
    format: ExportFormat;
    userId?: number;
    coachId?: number;
    startDate?: string;
    endDate?: string;
    exportType: string;
  }, operatorId: number) =>
    api
      .post('/exports', data, {
        params: { operatorId },
        responseType: 'blob'
      })
      .then((r) => r.data),
  history: (operatorId?: number) =>
    api.get<ExportRecord[]>('/exports/history', { params: { operatorId } }).then((r) => r.data)
};

export const interruptionApi = {
  list: (coachId?: number, userId?: number) =>
    api
      .get<CheckInInterruption[]>('/interruptions', { params: { coachId, userId } })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<CheckInInterruption>(`/interruptions/${id}`).then((r) => r.data),
  handle: (id: number, data: {
    operatorId: number;
    reason: string;
    actionTaken: string;
    newStatus?: number;
    remarks?: string;
  }) => api.put<CheckInInterruption>(`/interruptions/${id}/handle`, data).then((r) => r.data)
};

export default api;
