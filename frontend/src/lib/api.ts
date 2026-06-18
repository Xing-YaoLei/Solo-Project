import axios from 'axios';
import { getToken, removeToken } from './auth';
import type {
  LoginRequest,
  LoginResponse,
  User,
  WorkOrder,
  WorkOrderCreate,
  Part,
  PartCreate,
  OrderPart,
  Quote,
  QuoteCreate,
  Inspection,
  Shortage,
  ShortageCreate,
  ShortageUpdate,
  PaginatedResponse,
  StatisticsOverview,
  ReworkRateByPeriod,
  ReworkTraceItem,
  OrderStatusDistribution,
  TechnicianPerformance,
  PartsUsage,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  getCurrentUser: () => api.get<User>('/auth/me'),
};

export const workOrderApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<WorkOrder>>('/work-orders', { params }),
  get: (id: string) => api.get<WorkOrder>(`/work-orders/${id}`),
  create: (data: WorkOrderCreate) => api.post<WorkOrder>('/work-orders', data),
  update: (id: string, data: Partial<WorkOrderCreate>) =>
    api.put<WorkOrder>(`/work-orders/${id}`, data),
  changeStatus: (id: string, status: string) =>
    api.patch<WorkOrder>(`/work-orders/${id}/status`, undefined, { params: { status } }),
  rework: (id: string, reason: string) =>
    api.post<WorkOrder>(`/work-orders/${id}/rework`, undefined, { params: { reason } }),
  batchUpdate: (ids: string[], status: string) =>
    api.post('/work-orders/batch', { order_ids: ids }, { params: { status } }),
};

export const partApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Part[]>('/parts', { params }),
  get: (id: string) => api.get<Part>(`/parts/${id}`),
  create: (data: PartCreate) => api.post<Part>('/parts', data),
  update: (id: string, data: Partial<PartCreate>) =>
    api.put<Part>(`/parts/${id}`, data),
  getLowStock: () => api.get<Part[]>('/parts/low-stock'),
  getOrderParts: (orderId: string) =>
    api.get<OrderPart[]>(`/work-orders/${orderId}/parts`),
  addToOrder: (orderId: string, data: { part_id: string; quantity: number; unit_price: number }) =>
    api.post<OrderPart>(`/work-orders/${orderId}/parts`, data),
  issuePart: (orderId: string, partId: string) =>
    api.patch<OrderPart>(`/work-orders/${orderId}/parts/${partId}/issue`),
};

export const quoteApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Quote[]>('/quotes', { params }),
  get: (id: string) => api.get<Quote>(`/quotes/${id}`),
  create: (data: QuoteCreate) => api.post<Quote>('/quotes', data),
  changeStatus: (id: string, status: string, notes?: string) =>
    api.patch<Quote>(`/quotes/${id}/status`, undefined, { params: { status, notes } }),
};

export const inspectionApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Inspection[]>('/inspections', { params }),
  get: (id: string) => api.get<Inspection>(`/inspections/${id}`),
  create: (data: FormData) =>
    api.post<Inspection>('/inspections', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addPhotos: (id: string, data: FormData) =>
    api.post(`/inspections/${id}/photos`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const shortageApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<Shortage[]>('/shortages', { params }),
  get: (id: string) => api.get<Shortage>(`/shortages/${id}`),
  create: (data: ShortageCreate) =>
    api.post<Shortage>('/shortages', data),
  update: (id: string, data: ShortageUpdate) =>
    api.patch<Shortage>(`/shortages/${id}`, data),
};

export const statisticsApi = {
  getOverview: () => api.get<StatisticsOverview>('/statistics/overview'),
  getReworkRate: (params?: { period?: string; start_date?: string; end_date?: string }) =>
    api.get<ReworkRateByPeriod[]>('/statistics/rework-rate', { params }),
  getReworkTrace: (params?: { rework_order_id?: string }) =>
    api.get<ReworkTraceItem[]>('/statistics/rework-trace', { params }),
  getStatusDistribution: () =>
    api.get<OrderStatusDistribution[]>('/statistics/status-distribution'),
  getTechnicianPerformance: (params?: { start_date?: string; end_date?: string }) =>
    api.get<TechnicianPerformance[]>('/statistics/technician-performance', { params }),
  getPartsUsage: (params?: { start_date?: string; end_date?: string }) =>
    api.get<PartsUsage[]>('/statistics/parts-usage', { params }),
};

export const dashboardApi = {
  getStats: () => api.get<StatisticsOverview>('/statistics/overview').then((r) => ({
    data: {
      active_orders: r.data.active_orders,
      pending_shortages: r.data.pending_shortages,
      today_appointments: 0,
      pending_quotes: 0,
      completed_today: r.data.completed_this_month,
      rework_rate: r.data.rework_rate,
    },
  })),
  getRecentOrders: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<WorkOrder>>('/work-orders', { params: { page: 1, page_size: 10, ...params } }).then((r) => ({ data: r.data.items })),
};

export default api;
