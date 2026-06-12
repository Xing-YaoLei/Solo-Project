import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const cleaningApi = {
  list: (params?: Record<string, any>) => api.get('/cleaning', { params }),
  get: (id: number) => api.get(`/cleaning/${id}`),
  create: (data: any) => api.post('/cleaning', data),
  update: (id: number, data: any) => api.put(`/cleaning/${id}`, data),
  submitReview: (id: number) => api.post(`/cleaning/${id}/submit-review`),
  startReview: (id: number) => api.post(`/cleaning/${id}/start-review`),
  review: (id: number, data: any) => api.post(`/cleaning/${id}/review`, data),
  close: (id: number, data: any) => api.post(`/cleaning/${id}/close`, data),
  handleOffline: (id: number, remarks?: string) =>
    api.post(`/cleaning/${id}/handle-offline`, null, { params: { remarks } }),
  statusLogs: (id: number) => api.get(`/cleaning/${id}/status-logs`),
}

export const devicesApi = {
  list: (params?: Record<string, any>) => api.get('/devices', { params }),
  get: (id: number) => api.get(`/devices/${id}`),
  create: (data: any) => api.post('/devices', data),
  update: (id: number, data: any) => api.put(`/devices/${id}`, data),
  offline: () => api.get('/devices/offline'),
  heartbeat: (id: number) => api.post(`/devices/${id}/heartbeat`),
  markOffline: (id: number) => api.post(`/devices/${id}/mark-offline`),
}

export const pointsApi = {
  list: (params?: Record<string, any>) => api.get('/points', { params }),
  get: (id: number) => api.get(`/points/${id}`),
  create: (data: any) => api.post('/points', data),
  update: (id: number, data: any) => api.put(`/points/${id}`, data),
}

export const personsApi = {
  list: () => api.get('/persons'),
  get: (id: number) => api.get(`/persons/${id}`),
  create: (data: any) => api.post('/persons', data),
}

export const statisticsApi = {
  summary: (params?: Record<string, any>) => api.get('/statistics/summary', { params }),
  byChannel: (params?: Record<string, any>) => api.get('/statistics/by-channel', { params }),
  byPerson: (params?: Record<string, any>) => api.get('/statistics/by-person', { params }),
  byCloseReason: (params?: Record<string, any>) => api.get('/statistics/by-close-reason', { params }),
}

export default api
