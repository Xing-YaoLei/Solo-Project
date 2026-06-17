import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
}

export const usersApi = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  getUsersByRole: (role: string) => api.get(`/users/role/${role}`),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  getStats: () => api.get('/users/stats'),
}

export const propertiesApi = {
  getProperties: (params?: any) => api.get('/properties', { params }),
  getProperty: (id: string) => api.get(`/properties/${id}`),
  createProperty: (data: any) => api.post('/properties', data),
  updateProperty: (id: string, data: any) => api.put(`/properties/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.put(`/properties/${id}/status`, { status }),
  deleteProperty: (id: string) => api.delete(`/properties/${id}`),
  getStats: () => api.get('/properties/stats'),
  getFilters: () => api.get('/properties/filters'),
  uploadPhoto: (propertyId: string, data: any) =>
    api.post(`/properties/${propertyId}/photos`, data),
  updatePhoto: (photoId: string, data: any) =>
    api.put(`/properties/photos/${photoId}`, data),
  deletePhoto: (photoId: string) => api.delete(`/properties/photos/${photoId}`),
  setCoverPhoto: (propertyId: string, photoId: string) =>
    api.post(`/properties/${propertyId}/photos/${photoId}/cover`),
}

export const tenantsApi = {
  getTenants: (params?: any) => api.get('/tenants', { params }),
  getTenant: (id: string) => api.get(`/tenants/${id}`),
  createTenant: (data: any) => api.post('/tenants', data),
  updateTenant: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  deleteTenant: (id: string) => api.delete(`/tenants/${id}`),
  getStats: () => api.get('/tenants/stats'),
}

export const contractsApi = {
  getContracts: (params?: any) => api.get('/contracts', { params }),
  getContract: (id: string) => api.get(`/contracts/${id}`),
  createContract: (data: any) => api.post('/contracts', data),
  updateContract: (id: string, data: any) => api.put(`/contracts/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.put(`/contracts/${id}/status`, { status }),
  createVersion: (id: string, data: any) =>
    api.post(`/contracts/${id}/version`, data),
  deleteContract: (id: string) => api.delete(`/contracts/${id}`),
  getStats: () => api.get('/contracts/stats'),
}

export const maintenanceApi = {
  getRecords: (params?: any) => api.get('/maintenance/records', { params }),
  getRecord: (id: string) => api.get(`/maintenance/records/${id}`),
  createRecord: (data: any) => api.post('/maintenance/records', data),
  updateRecord: (id: string, data: any) =>
    api.put(`/maintenance/records/${id}`, data),
  deleteRecord: (id: string) => api.delete(`/maintenance/records/${id}`),
  getWorkOrders: (params?: any) => api.get('/maintenance/workorders', { params }),
  getWorkOrder: (id: string) => api.get(`/maintenance/workorders/${id}`),
  createWorkOrder: (recordId: string, data: any) =>
    api.post(`/maintenance/records/${recordId}/workorders`, data),
  updateWorkOrder: (id: string, data: any) =>
    api.put(`/maintenance/workorders/${id}`, data),
  assignWorker: (id: string, workerId: string) =>
    api.put(`/maintenance/workorders/${id}/assign`, { workerId }),
  completeWorkOrder: (id: string, solution: string, cost?: number) =>
    api.put(`/maintenance/workorders/${id}/complete`, { solution, cost }),
  deleteWorkOrder: (id: string) => api.delete(`/maintenance/workorders/${id}`),
  getStats: () => api.get('/maintenance/records/stats'),
  getTypes: () => api.get('/maintenance/records/types'),
}

export const utilitiesApi = {
  getReadings: (params?: any) => api.get('/utilities', { params }),
  getReading: (id: string) => api.get(`/utilities/${id}`),
  createReading: (data: any) => api.post('/utilities', data),
  updateReading: (id: string, data: any) => api.put(`/utilities/${id}`, data),
  deleteReading: (id: string) => api.delete(`/utilities/${id}`),
  getPropertyReadings: (propertyId: string, params?: any) =>
    api.get(`/utilities/property/${propertyId}`, { params }),
  getStats: () => api.get('/utilities/stats'),
  getTypes: () => api.get('/utilities/types'),
}

export const tasksApi = {
  getTasks: (params?: any) => api.get('/tasks', { params }),
  getTask: (id: string) => api.get(`/tasks/${id}`),
  createTask: (data: any) => api.post('/tasks', data),
  updateTask: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  updateStatus: (id: string, status: string, remark?: string) =>
    api.put(`/tasks/${id}/status`, { status, remark }),
  assignTask: (id: string, assigneeId: string, remark?: string) =>
    api.put(`/tasks/${id}/assign`, { assigneeId, remark }),
  reassignTask: (id: string, assigneeId: string, reason?: string) =>
    api.put(`/tasks/${id}/reassign`, { assigneeId, reason }),
  rejectTask: (id: string, rejectReason: string) =>
    api.put(`/tasks/${id}/reject`, { rejectReason }),
  resubmitTask: (id: string, data?: any) =>
    api.put(`/tasks/${id}/resubmit`, data),
  addMaterials: (id: string, materials: any[]) =>
    api.post(`/tasks/${id}/materials`, { materials }),
  addComment: (id: string, content: string, attachments?: any[]) =>
    api.post(`/tasks/${id}/comments`, { content, attachments }),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  getStats: () => api.get('/tasks/stats'),
  getMyTasks: (status?: string) => api.get('/tasks/mine', { params: { status } }),
  getOverdueTasks: () => api.get('/tasks/overdue'),
  getTypes: () => api.get('/tasks/types'),
  getStatuses: () => api.get('/tasks/statuses'),
  getPriorities: () => api.get('/tasks/priorities'),
}

export const financeApi = {
  getRecords: (params?: any) => api.get('/finance', { params }),
  getRecord: (id: string) => api.get(`/finance/${id}`),
  createRecord: (data: any) => api.post('/finance', data),
  updateRecord: (id: string, data: any) => api.put(`/finance/${id}`, data),
  markPaid: (id: string) => api.put(`/finance/${id}/paid`),
  deleteRecord: (id: string) => api.delete(`/finance/${id}`),
  getStats: () => api.get('/finance/stats'),
  getTenantFinance: (tenantId: string) =>
    api.get(`/finance/tenant/${tenantId}`),
  getTypes: () => api.get('/finance/types'),
  getStatuses: () => api.get('/finance/statuses'),
}

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  refreshDashboard: () => api.post('/reports/dashboard/refresh'),
  getOccupancyReport: (params?: any) =>
    api.get('/reports/occupancy', { params }),
  getTaskReport: (params?: any) => api.get('/reports/tasks', { params }),
  getRevenueReport: (params?: any) => api.get('/reports/revenue', { params }),
  getMaintenanceReport: (params?: any) =>
    api.get('/reports/maintenance', { params }),
}
