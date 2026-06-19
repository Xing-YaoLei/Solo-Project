import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const funnelApi = {
  getOverview: (params) => api.get('/funnel/overview', { params }),
  getQuotations: (params) => api.get('/funnel/quotations', { params }),
  getRejectReasons: (params) => api.get('/funnel/analytics/reject-reasons', { params }),
  getSalespersonRanking: (params) => api.get('/funnel/analytics/salesperson-ranking', { params }),
}

export const reworkApi = {
  getStats: (params) => api.get('/rework/stats', { params }),
  getOrders: (params) => api.get('/rework/orders', { params }),
}

export const repairOrderApi = {
  list: (params) => api.get('/repair-orders/', { params }),
  getDetail: (id) => api.get(`/repair-orders/${id}`),
  getPhotos: (id) => api.get(`/repair-orders/${id}/photos`),
  create: (data) => api.post('/repair-orders/', data),
}

export const vehicleApi = {
  list: (params) => api.get('/vehicles/', { params }),
  getDetail: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles/', data),
  getWarningsSummary: () => api.get('/vehicles/warnings/summary'),
}

export const stockTaskApi = {
  list: (params) => api.get('/stock-tasks/', { params }),
  getSummary: () => api.get('/stock-tasks/summary'),
  getDetail: (id) => api.get(`/stock-tasks/${id}`),
  create: (data) => api.post('/stock-tasks/', data),
  update: (id, data) => api.patch(`/stock-tasks/${id}`, data),
}

export const warningApi = {
  listThresholds: (params) => api.get('/warnings/thresholds', { params }),
  createThreshold: (data) => api.post('/warnings/thresholds', data),
  updateThreshold: (id, data) => api.patch(`/warnings/thresholds/${id}`, data),
  getThresholdLogs: (id, params) => api.get(`/warnings/thresholds/${id}/logs`, { params }),
  getAllLogs: (params) => api.get('/warnings/logs', { params }),
}

export default api
