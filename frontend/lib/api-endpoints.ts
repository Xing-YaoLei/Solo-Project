import apiClient from './api';
import type {
  LoginRequest,
  LoginResponse,
  User,
  WorkOrder,
  PaginatedResponse,
  Vehicle,
  Part,
  PartRequest,
  QualityCheck,
  MaintenanceReminder,
  DashboardStats,
  ReworkRateData,
  RevenueTrendItem,
  TechnicianWorkload,
  ServiceItemStat,
  PartUsageStat,
  KanbanStats,
  BatchUpdateRequest,
  WorkOrderLog,
  PartRequestHistory,
} from './types';

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/api/auth/login', data),
  getProfile: (): Promise<any> =>
    apiClient.get('/api/auth/profile'),
};

export const workOrderApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string; vehicleId?: string }): Promise<PaginatedResponse<WorkOrder>> =>
    apiClient.get('/api/work-orders', { params }),
  getById: (id: string): Promise<WorkOrder> =>
    apiClient.get(`/api/work-orders/${id}`),
  create: (data: any): Promise<WorkOrder> =>
    apiClient.post('/api/work-orders', data),
  update: (id: string, data: any): Promise<WorkOrder> =>
    apiClient.patch(`/api/work-orders/${id}`, data),
  updateStatus: (id: string, status: string): Promise<WorkOrder> =>
    apiClient.patch(`/api/work-orders/${id}/status`, { status }),
  assignTechnician: (id: string, technicianId: string, operatorId: string): Promise<WorkOrder> =>
    apiClient.patch(`/api/work-orders/${id}/assign`, { technicianId, operatorId }),
  batchUpdateStatus: (data: BatchUpdateRequest): Promise<any> =>
    apiClient.post('/api/work-orders/batch-status', data),
  batchAssign: (data: BatchUpdateRequest): Promise<any> =>
    apiClient.post('/api/work-orders/batch-assign', data),
  getTechnicians: (): Promise<any[]> =>
    apiClient.get('/api/work-orders/technicians/list'),
  getLogs: (id: string): Promise<WorkOrderLog[]> =>
    apiClient.get(`/api/work-orders/${id}/logs`),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/work-orders/${id}`),
};

export const vehicleApi = {
  getAll: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Vehicle>> =>
    apiClient.get('/api/vehicles', { params }),
  getById: (id: string): Promise<Vehicle> =>
    apiClient.get(`/api/vehicles/${id}`),
  create: (data: any): Promise<Vehicle> =>
    apiClient.post('/api/vehicles', data),
  update: (id: string, data: any): Promise<Vehicle> =>
    apiClient.patch(`/api/vehicles/${id}`, data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/vehicles/${id}`),
};

export const partApi = {
  getAll: (params?: { page?: number; pageSize?: number; category?: string }): Promise<PaginatedResponse<Part>> =>
    apiClient.get('/api/parts', { params }),
  getById: (id: string): Promise<Part> =>
    apiClient.get(`/api/parts/${id}`),
  create: (data: any): Promise<Part> =>
    apiClient.post('/api/parts', data),
  update: (id: string, data: any): Promise<Part> =>
    apiClient.patch(`/api/parts/${id}`, data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/parts/${id}`),
};

export const partRequestApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string; workOrderId?: string }): Promise<PaginatedResponse<PartRequest>> =>
    apiClient.get('/api/part-requests', { params }),
  getById: (id: string): Promise<PartRequest> =>
    apiClient.get(`/api/part-requests/${id}`),
  create: (data: any): Promise<PartRequest> =>
    apiClient.post('/api/part-requests', data),
  updateStatus: (id: string, data: { status: string; handlerId: string; handlingNotes?: string; source?: string; beforeMaterial?: string; afterMaterial?: string; conclusion?: string }): Promise<PartRequest> =>
    apiClient.patch(`/api/part-requests/${id}/status`, data),
  getHistories: (id: string): Promise<PartRequestHistory[]> =>
    apiClient.get(`/api/part-requests/${id}/histories`),
  getKanbanStats: (): Promise<KanbanStats> =>
    apiClient.get('/api/part-requests/kanban/stats'),
  getTimeoutRequests: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<PartRequest>> =>
    apiClient.get('/api/part-requests/kanban/timeout', { params }),
  getLowStockParts: (): Promise<any[]> =>
    apiClient.get('/api/part-requests/low-stock/warning'),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/part-requests/${id}`),
};

export const qualityCheckApi = {
  getAll: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<QualityCheck>> =>
    apiClient.get('/api/quality-checks', { params }),
  getById: (id: string): Promise<QualityCheck> =>
    apiClient.get(`/api/quality-checks/${id}`),
  create: (data: any): Promise<QualityCheck> =>
    apiClient.post('/api/quality-checks', data),
};

export const reminderApi = {
  getAll: (params?: { page?: number; pageSize?: number; vehicleId?: string; isCompleted?: boolean }): Promise<PaginatedResponse<MaintenanceReminder>> =>
    apiClient.get('/api/maintenance-reminders', { params }),
  getById: (id: string): Promise<MaintenanceReminder> =>
    apiClient.get(`/api/maintenance-reminders/${id}`),
  create: (data: any): Promise<MaintenanceReminder> =>
    apiClient.post('/api/maintenance-reminders', data),
  update: (id: string, data: any): Promise<MaintenanceReminder> =>
    apiClient.patch(`/api/maintenance-reminders/${id}`, data),
  complete: (id: string): Promise<MaintenanceReminder> =>
    apiClient.patch(`/api/maintenance-reminders/${id}/complete`),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/api/maintenance-reminders/${id}`),
};

export const statsApi = {
  getDashboardStats: (): Promise<DashboardStats> =>
    apiClient.get('/api/statistics/dashboard'),
  getWorkOrderStatusDistribution: (): Promise<any[]> =>
    apiClient.get('/api/statistics/work-order-status-distribution'),
  getReworkRate: (params?: { startDate?: string; endDate?: string }): Promise<ReworkRateData> =>
    apiClient.get('/api/statistics/rework-rate', { params }),
  getReworkOrders: (params?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }): Promise<PaginatedResponse<WorkOrder>> =>
    apiClient.get('/api/statistics/rework-orders', { params }),
  getTechnicianWorkload: (params?: { startDate?: string; endDate?: string }): Promise<TechnicianWorkload[]> =>
    apiClient.get('/api/statistics/technician-workload', { params }),
  getServiceItemStats: (params?: { startDate?: string; endDate?: string }): Promise<ServiceItemStat[]> =>
    apiClient.get('/api/statistics/service-items', { params }),
  getRevenueTrend: (params?: { type?: string; startDate?: string; endDate?: string }): Promise<RevenueTrendItem[]> =>
    apiClient.get('/api/statistics/revenue-trend', { params }),
  getPartUsageStats: (params?: { startDate?: string; endDate?: string }): Promise<PartUsageStat[]> =>
    apiClient.get('/api/statistics/part-usage', { params }),
};
