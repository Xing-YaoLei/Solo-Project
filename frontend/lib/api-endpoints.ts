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
  StatisticsOverview,
  RevenueTrendItem,
  ReworkTrendItem,
  TechnicianWorkload,
  ServiceTypeStat,
  ReworkOrder,
  OperationLog,
  ServiceItem,
  PartUsage,
  BatchUpdateRequest,
} from './types';

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/auth/login', data),
  logout: (): Promise<void> => apiClient.post('/auth/logout'),
  getProfile: (): Promise<User> => apiClient.get('/auth/profile'),
};

export const workOrderApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string; search?: string; advisorId?: string; technicianId?: string }): Promise<PaginatedResponse<WorkOrder>> =>
    apiClient.get('/work-orders', { params }),
  getById: (id: string): Promise<WorkOrder> => apiClient.get(`/work-orders/${id}`),
  create: (data: Partial<WorkOrder>): Promise<WorkOrder> =>
    apiClient.post('/work-orders', data),
  update: (id: string, data: Partial<WorkOrder>): Promise<WorkOrder> =>
    apiClient.put(`/work-orders/${id}`, data),
  delete: (id: string): Promise<void> => apiClient.delete(`/work-orders/${id}`),
  updateStatus: (id: string, status: string): Promise<WorkOrder> =>
    apiClient.patch(`/work-orders/${id}/status`, { status }),
  assignTechnician: (id: string, technicianId: string): Promise<WorkOrder> =>
    apiClient.patch(`/work-orders/${id}/assign-technician`, { technicianId }),
  batchUpdateStatus: (data: BatchUpdateRequest): Promise<void> =>
    apiClient.patch('/work-orders/batch/status', data),
  batchAssignTechnician: (data: BatchUpdateRequest): Promise<void> =>
    apiClient.patch('/work-orders/batch/assign-technician', data),
};

export const vehicleApi = {
  getAll: (params?: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResponse<Vehicle>> =>
    apiClient.get('/vehicles', { params }),
  getById: (id: string): Promise<Vehicle> => apiClient.get(`/vehicles/${id}`),
  create: (data: Partial<Vehicle>): Promise<Vehicle> =>
    apiClient.post('/vehicles', data),
  update: (id: string, data: Partial<Vehicle>): Promise<Vehicle> =>
    apiClient.put(`/vehicles/${id}`, data),
  delete: (id: string): Promise<void> => apiClient.delete(`/vehicles/${id}`),
};

export const partApi = {
  getAll: (params?: { page?: number; pageSize?: number; category?: string; lowStock?: boolean }): Promise<PaginatedResponse<Part>> =>
    apiClient.get('/parts', { params }),
  getById: (id: string): Promise<Part> => apiClient.get(`/parts/${id}`),
  create: (data: Partial<Part>): Promise<Part> =>
    apiClient.post('/parts', data),
  update: (id: string, data: Partial<Part>): Promise<Part> =>
    apiClient.put(`/parts/${id}`, data),
  delete: (id: string): Promise<void> => apiClient.delete(`/parts/${id}`),
  updateStock: (id: string, quantity: number): Promise<Part> =>
    apiClient.patch(`/parts/${id}/stock`, { quantity }),
};

export const partRequestApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedResponse<PartRequest>> =>
    apiClient.get('/part-requests', { params }),
  getById: (id: string): Promise<PartRequest> => apiClient.get(`/part-requests/${id}`),
  create: (data: Partial<PartRequest>): Promise<PartRequest> =>
    apiClient.post('/part-requests', data),
  update: (id: string, data: Partial<PartRequest>): Promise<PartRequest> =>
    apiClient.put(`/part-requests/${id}`, data),
  delete: (id: string): Promise<void> => apiClient.delete(`/part-requests/${id}`),
  approve: (id: string): Promise<PartRequest> =>
    apiClient.patch(`/part-requests/${id}/approve`),
  reject: (id: string, reason?: string): Promise<PartRequest> =>
    apiClient.patch(`/part-requests/${id}/reject`, { reason }),
  fulfill: (id: string): Promise<PartRequest> =>
    apiClient.patch(`/part-requests/${id}/fulfill`),
};

export const qualityCheckApi = {
  getAll: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<QualityCheck>> =>
    apiClient.get('/quality-checks', { params }),
  getById: (id: string): Promise<QualityCheck> => apiClient.get(`/quality-checks/${id}`),
  create: (data: Partial<QualityCheck>): Promise<QualityCheck> =>
    apiClient.post('/quality-checks', data),
  getByWorkOrderId: (workOrderId: string): Promise<QualityCheck[]> =>
    apiClient.get(`/work-orders/${workOrderId}/quality-checks`),
};

export const reminderApi = {
  getAll: (params?: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedResponse<MaintenanceReminder>> =>
    apiClient.get('/reminders', { params }),
  getById: (id: string): Promise<MaintenanceReminder> => apiClient.get(`/reminders/${id}`),
  create: (data: Partial<MaintenanceReminder>): Promise<MaintenanceReminder> =>
    apiClient.post('/reminders', data),
  update: (id: string, data: Partial<MaintenanceReminder>): Promise<MaintenanceReminder> =>
    apiClient.put(`/reminders/${id}`, data),
  delete: (id: string): Promise<void> => apiClient.delete(`/reminders/${id}`),
  complete: (id: string): Promise<MaintenanceReminder> =>
    apiClient.patch(`/reminders/${id}/complete`),
};

export const statsApi = {
  getDashboardStats: (): Promise<DashboardStats> =>
    apiClient.get('/stats/dashboard'),
  getOverview: (params?: { startDate?: string; endDate?: string }): Promise<StatisticsOverview> =>
    apiClient.get('/stats/overview', { params }),
  getRevenueTrend: (params?: { period?: string; startDate?: string; endDate?: string }): Promise<RevenueTrendItem[]> =>
    apiClient.get('/stats/revenue-trend', { params }),
  getReworkTrend: (params?: { period?: string; startDate?: string; endDate?: string }): Promise<ReworkTrendItem[]> =>
    apiClient.get('/stats/rework-trend', { params }),
  getTechnicianWorkload: (params?: { startDate?: string; endDate?: string }): Promise<TechnicianWorkload[]> =>
    apiClient.get('/stats/technician-workload', { params }),
  getServiceTypeStats: (params?: { startDate?: string; endDate?: string }): Promise<ServiceTypeStat[]> =>
    apiClient.get('/stats/service-types', { params }),
  getReworkOrders: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<ReworkOrder>> =>
    apiClient.get('/stats/rework-orders', { params }),
};

export const operationLogApi = {
  getByWorkOrderId: (workOrderId: string): Promise<OperationLog[]> =>
    apiClient.get(`/work-orders/${workOrderId}/logs`),
  getByPartRequestId: (partRequestId: string): Promise<OperationLog[]> =>
    apiClient.get(`/part-requests/${partRequestId}/logs`),
};

export const serviceItemApi = {
  getByWorkOrderId: (workOrderId: string): Promise<ServiceItem[]> =>
    apiClient.get(`/work-orders/${workOrderId}/service-items`),
  create: (workOrderId: string, data: Partial<ServiceItem>): Promise<ServiceItem> =>
    apiClient.post(`/work-orders/${workOrderId}/service-items`, data),
  update: (id: string, data: Partial<ServiceItem>): Promise<ServiceItem> =>
    apiClient.put(`/service-items/${id}`, data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/service-items/${id}`),
};

export const partUsageApi = {
  getByWorkOrderId: (workOrderId: string): Promise<PartUsage[]> =>
    apiClient.get(`/work-orders/${workOrderId}/part-usage`),
  create: (workOrderId: string, data: Partial<PartUsage>): Promise<PartUsage> =>
    apiClient.post(`/work-orders/${workOrderId}/part-usage`, data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/part-usage/${id}`),
};
