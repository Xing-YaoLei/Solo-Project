import api from './client';
import {
  User,
  Store,
  LossReport,
  LossReportDetail,
  Review,
  Approval,
  Communication,
  DashboardStats,
  LossTrendItem,
  StoreLossRank,
  TodoItem,
} from '@/types';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authAPI = {
  login: (params: LoginParams) => {
    const formData = new FormData();
    formData.append('username', params.username);
    formData.append('password', params.password);
    return api.post<LoginResponse>('/auth/login', formData);
  },

  getCurrentUser: () => api.get<User>('/auth/me'),

  initData: () => api.post('/auth/init-data'),
};

export const storeAPI = {
  getStores: (params?: { city?: string; is_active?: boolean }) =>
    api.get<Store[]>('/stores', { params }),

  getStore: (id: number) => api.get<Store>(`/stores/${id}`),

  createStore: (data: Omit<Store, 'id' | 'created_at' | 'is_active' | 'current_month_loss' | 'current_month_loss_rate' | 'manager_name'>) =>
    api.post<Store>('/stores', data),

  updateStore: (id: number, data: Partial<Store>) => api.put<Store>(`/stores/${id}`, data),
};

export interface LossReportListParams {
  skip?: number;
  limit?: number;
  status?: string;
  store_id?: number;
  category?: string;
  is_abnormal?: boolean;
  date_from?: string;
  date_to?: string;
  my_todo?: boolean;
}

export const lossReportAPI = {
  getLossReports: (params?: LossReportListParams) =>
    api.get<LossReport[]>('/loss-reports', { params }),

  getLossReport: (id: number) => api.get<LossReportDetail>(`/loss-reports/${id}`),

  createLossReport: (data: {
    title: string;
    category: string;
    loss_date: string;
    cost_amount: number;
    sale_amount?: number;
    quantity: number;
    unit: string;
    description?: string;
    store_id: number;
    responsible_staff_id?: number;
  }) => api.post<LossReport>('/loss-reports', data),

  updateLossReport: (id: number, data: Partial<LossReport>) =>
    api.put<LossReport>(`/loss-reports/${id}`, data),

  submitForReview: (id: number) =>
    api.post(`/loss-reports/${id}/submit`),

  transitionStatus: (id: number, data: {
    from_status: string;
    to_status: string;
    reason?: string;
  }) => api.post(`/loss-reports/${id}/transition`, data),

  deleteLossReport: (id: number) => api.delete(`/loss-reports/${id}`),

  submitForApproval: (id: number) =>
    api.post(`/approvals/${id}/submit-for-approval`),
};

export const reviewAPI = {
  createReview: (data: {
    review_opinion: string;
    result: string;
    verified_amount?: number;
    cost_verified: boolean;
    store_verified: boolean;
    follow_up_days: number;
    loss_report_id: number;
  }) => api.post<Review>('/reviews', data),

  getReviews: (params?: { loss_report_id?: number; result?: string }) =>
    api.get<Review[]>('/reviews', { params }),
};

export const approvalAPI = {
  createApproval: (data: {
    approval_opinion: string;
    result: string;
    loss_report_id: number;
  }) => api.post<Approval>('/approvals', data),

  getApprovals: (params?: { loss_report_id?: number; result?: string }) =>
    api.get<Approval[]>('/approvals', { params }),
};

export const communicationAPI = {
  getCommunications: (loss_report_id: number) =>
    api.get<Communication[]>(`/communications`, { params: { loss_report_id } }),

  createCommunication: (data: {
    message: string;
    message_type?: string;
    loss_report_id: number;
    reply_to_id?: number;
  }) => api.post<Communication>('/communications', data),

  deleteCommunication: (id: number) => api.delete(`/communications/${id}`),
};

export const statisticsAPI = {
  getDashboard: () => api.get<DashboardStats>('/statistics/dashboard'),

  getLossTrend: (params?: { period?: string; store_id?: number }) =>
    api.get<LossTrendItem[]>('/statistics/loss-trend', { params }),

  getStoreRanking: (params?: { period?: string }) =>
    api.get<StoreLossRank[]>('/statistics/store-ranking', { params }),

  getThreshold: () => api.get<{ threshold: number }>('/statistics/threshold'),
};

export const todoAPI = {
  getTodos: (params?: { is_completed?: boolean; loss_report_id?: number; my_only?: boolean }) =>
    api.get<TodoItem[]>('/todos', { params }),

  getTodo: (id: number) => api.get<TodoItem>(`/todos/${id}`),

  createTodo: (data: {
    title: string;
    description?: string;
    due_date?: string;
    loss_report_id: number;
    assignee_id: number;
  }) => api.post<TodoItem>('/todos', data),

  toggleTodo: (id: number) => api.put<TodoItem>(`/todos/${id}/toggle`),

  deleteTodo: (id: number) => api.delete(`/todos/${id}`),
};
