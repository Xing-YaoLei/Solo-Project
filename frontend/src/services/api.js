import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const analyticsAPI = {
  getFunnel: (params) => api.get('/analytics/funnel', { params }),
  getRenewalRateTrend: (days) => api.get('/analytics/renewal-rate-trend', { params: { days } }),
  getRefundReasons: (params) => api.get('/analytics/refund-reasons', { params }),
  getCoachRanking: (params) => api.get('/analytics/coach-ranking', { params }),
  getExpiringMembers: (params) => api.get('/analytics/expiring-members', { params }),
  getVerificationRecords: (params) => api.get('/analytics/verification-records', { params }),
  getFunnelStageMembers: (params) => api.get('/analytics/funnel-stage-members', { params }),
  getRefundReasonMembers: (params) => api.get('/analytics/refund-reason-members', { params }),
}

export const thresholdAPI = {
  list: () => api.get('/thresholds'),
  get: (id) => api.get(`/thresholds/${id}`),
  create: (data) => api.post('/thresholds', data),
  update: (id, data) => api.put(`/thresholds/${id}`, data),
  getAuditLogs: (id, params) => api.get(`/thresholds/${id}/audit-logs`, { params }),
}

export const renewalNoteAPI = {
  list: (params) => api.get('/renewal-notes', { params }),
  get: (id) => api.get(`/renewal-notes/${id}`),
  create: (data) => api.post('/renewal-notes', data),
  update: (id, data) => api.put(`/renewal-notes/${id}`, data),
  remove: (id) => api.delete(`/renewal-notes/${id}`),
}

export const memberAPI = {
  list: (params) => api.get('/members', { params }),
  getDetail: (id) => api.get(`/members/${id}`),
  getCourses: (id, params) => api.get(`/members/${id}/courses`, { params }),
  getTransactions: (id, params) => api.get(`/members/${id}/transactions`, { params }),
  getRefunds: (id, params) => api.get(`/members/${id}/refunds`, { params }),
  getAccessRecords: (id, params) => api.get(`/members/${id}/access-records`, { params }),
  getRenewalNotes: (id, params) => api.get(`/members/${id}/renewal-notes`, { params }),
}

export default api
