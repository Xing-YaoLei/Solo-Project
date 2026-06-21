import axios from 'axios'

const API_BASE = '/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api

export interface LoginData {
  username: string
  password: string
}

export const authApi = {
  login: (data: LoginData) =>
    api.post('/auth/login', new URLSearchParams({
      username: data.username,
      password: data.password,
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
}

export const documentApi = {
  getDashboard: () => api.get('/documents/dashboard'),
  list: (params?: any) => api.get('/documents', { params }),
  get: (id: number) => api.get(`/documents/${id}`),
  create: (data: any) => api.post('/documents', data),
  update: (id: number, data: any) => api.put(`/documents/${id}`, data),
  advanceStatus: (id: number) => api.post(`/documents/${id}/advance-status`),
}

export const auditApi = {
  createInteraction: (data: any) => api.post('/interactions', data),
  getInteractions: (documentId: number) =>
    api.get(`/documents/${documentId}/interactions`),
  getRiskHits: (documentId: number) =>
    api.get(`/documents/${documentId}/risk-hits`),
  reanalyzeRisk: (documentId: number) =>
    api.post(`/documents/${documentId}/reanalyze-risk`),
  verifyVersion: (documentId: number) =>
    api.post(`/documents/${documentId}/verify-version`),
  audit: (documentId: number, data: any) =>
    api.post(`/documents/${documentId}/audit`, data),
  getAuditHistory: (documentId: number) =>
    api.get(`/documents/${documentId}/audit-history`),
}

export const statsApi = {
  getConversionTrend: (days: number = 30) =>
    api.get('/stats/conversion-trend', { params: { days } }),
  getByType: () => api.get('/stats/by-type'),
  getByAssignee: () => api.get('/stats/by-assignee'),
  getRiskDistribution: () => api.get('/stats/risk-distribution'),
}
