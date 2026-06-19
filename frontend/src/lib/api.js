import axios from 'axios'

const baseURL = '/api'

const request = axios.create({
  baseURL,
  timeout: 30000,
})

request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const msg = error.response?.data?.detail || error.message || '请求失败'
    console.error('[API Error]', msg, error.response?.status)
    return Promise.reject(new Error(msg))
  }
)

export const api = {
  // Packages
  listPackages: (params) => request.get('/v1/packages', { params }),
  getPackage: (id) => request.get(`/v1/packages/${id}`),
  createPackage: (data) => request.post('/v1/packages', data),
  updatePackage: (id, data) => request.put(`/v1/packages/${id}`, data),

  // Price Rules
  listPriceRules: (package_id) => request.get('/v1/price-rules', { params: { package_id } }),
  createPriceRule: (data) => request.post('/v1/price-rules', data),
  updatePriceRule: (id, data) => request.put(`/v1/price-rules/${id}`, data),
  calculatePrice: (params) => request.get('/v1/price-rules/calculate', { params }),

  // Stay Dates
  listStayDates: (params) => request.get('/v1/stay-dates', { params }),
  createStayDate: (data) => request.post('/v1/stay-dates', data),
  bulkCreateStayDates: (params) => request.post('/v1/stay-dates/bulk', null, { params }),
  updateStayDate: (id, data) => request.put(`/v1/stay-dates/${id}`, data),

  // Inventories
  listInventories: (params) => request.get('/v1/inventories', { params }),
  createInventory: (data) => request.post('/v1/inventories', data),
  updateInventory: (id, data) => request.put(`/v1/inventories/${id}`, data),
  checkInventory: (params) => request.get('/v1/inventories/check', { params }),

  // Orders
  listOrders: (params) => request.get('/v1/orders', { params }),
  getOrder: (id) => request.get(`/v1/orders/${id}`),
  getOrderByNo: (no) => request.get(`/v1/orders/by-no/${no}`),
  createOrder: (data, operator) => request.post('/v1/orders', data, { params: { operator } }),
  changeOrderStatus: (id, data) => request.put(`/v1/orders/${id}/status`, data),
  getOrderStatusLogs: (id) => request.get(`/v1/orders/${id}/status-logs`),

  // Verifications
  getVerification: (order_id) => request.get(`/v1/verifications/by-order/${order_id}`),
  updateVerification: (id, data) => request.put(`/v1/verifications/${id}`, data),

  // Deposits
  getDeposit: (order_id) => request.get(`/v1/deposits/by-order/${order_id}`),
  payDeposit: (id, data) => request.post(`/v1/deposits/${id}/pay`, data),
  refundDeposit: (id, data) => request.post(`/v1/deposits/${id}/refund`, data),

  // Anomalies
  listAnomalies: (params) => request.get('/v1/anomalies', { params }),
  getAnomaly: (id) => request.get(`/v1/anomalies/${id}`),
  createAnomaly: (data) => request.post('/v1/anomalies', data),
  updateAnomaly: (id, data) => request.put(`/v1/anomalies/${id}`, data),
  addAnomalyAction: (id, data) => request.post(`/v1/anomalies/${id}/actions`, data),

  // Analytics
  getConversion: (params) => request.get('/v1/analytics/conversion', { params }),
  getPackageConversion: (params) => request.get('/v1/analytics/package-conversion', { params }),

  // Exports
  createExport: (data) => request.post('/exports', data),
  listExportTasks: (status) => request.get('/exports/tasks', { params: { status } }),
  getExportTask: (id) => request.get(`/exports/tasks/${id}`),
  getDownloadUrl: (filename) => `/api/exports/download/${filename}`,
}

export default request
