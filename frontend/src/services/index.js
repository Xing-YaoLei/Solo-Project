import api from './api'

export const authApi = {
  login: (username, password) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form)
  },
  me: () => api.get('/auth/me'),
  listUsers: (role) => api.get('/auth/users', { params: { role } }),
}

export const studentsApi = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
}

export const scoresApi = {
  list: (params) => api.get('/scores', { params }),
  getByStudent: (studentId, semester) => api.get(`/scores/student/${studentId}`, { params: { semester } }),
  create: (data) => api.post('/scores', data),
  update: (id, data) => api.put(`/scores/${id}`, data),
}

export const reviewsApi = {
  list: (params) => api.get('/reviews', { params }),
  get: (id) => api.get(`/reviews/${id}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  recordView: (params) => api.get('/reviews/record-view', { params }),
  checkMaterials: (id, missing) => api.post(`/reviews/${id}/materials-check`, missing),
}

export const advisorsApi = {
  list: (params) => api.get('/advisors', { params }),
  get: (id) => api.get(`/advisors/${id}`),
  create: (data) => api.post('/advisors', data),
  update: (id, data) => api.put(`/advisors/${id}`, data),
  history: (id) => api.get(`/advisors/${id}/history`),
}

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }),
  get: (id) => api.get(`/notifications/${id}`),
  process: (id, data) => api.post(`/notifications/${id}/process`, data),
  unreadCount: () => api.get('/notifications/unread-count'),
  readAll: () => api.post('/notifications/read-all'),
}

export const reportsApi = {
  list: (params) => api.get('/reports', { params }),
  generate: (type, filter) => api.post(`/reports/generate/${type}`, filter),
  download: (id) => api.get(`/reports/download/${id}`, { responseType: 'blob' }),
  info: (id) => api.get(`/reports/${id}/info`),
  classroomUtilization: (params) => api.get('/reports/classroom-utilization', { params }),
  monthlySummary: (params) => api.get('/reports/monthly-summary', { params }),
}

export const auditApi = {
  list: (params) => api.get('/audit', { params }),
  byReview: (reviewId) => api.get(`/audit/review/${reviewId}`),
}

export const classroomsApi = {
  list: (params) => api.get('/classrooms', { params }),
  buildings: () => api.get('/classrooms/buildings'),
}
