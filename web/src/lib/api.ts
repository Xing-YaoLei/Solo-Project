import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
})

export const getElders = (params?: Record<string, string>) =>
  api.get('/elders', { params }).then((r) => r.data)

export const getElder = (id: string) =>
  api.get(`/elders/${id}`).then((r) => r.data)

export const createElder = (data: Record<string, unknown>) =>
  api.post('/elders', data).then((r) => r.data)

export const updateElder = (id: string, data: Record<string, unknown>) =>
  api.put(`/elders/${id}`, data).then((r) => r.data)

export const getReminders = (params?: Record<string, string>) =>
  api.get('/reminders', { params }).then((r) => r.data)

export const updateReminderStatus = (id: string, data: Record<string, unknown>) =>
  api.put(`/reminders/${id}/status`, data).then((r) => r.data)

export const bulkCheck = (data: Record<string, unknown>) =>
  api.post('/reminders/bulk-check', data).then((r) => r.data)

export const getFalls = (params?: Record<string, string>) =>
  api.get('/falls', { params }).then((r) => r.data)

export const getFall = (id: string) =>
  api.get(`/falls/${id}`).then((r) => r.data)

export const createFall = (data: Record<string, unknown>) =>
  api.post('/falls', data).then((r) => r.data)

export const addCommunication = (id: string, data: Record<string, unknown>) =>
  api.post(`/falls/${id}/communications`, data).then((r) => r.data)

export const addReview = (id: string, data: Record<string, unknown>) =>
  api.post(`/falls/${id}/review`, data).then((r) => r.data)

export const getVisits = (params?: Record<string, string>) =>
  api.get('/visits', { params }).then((r) => r.data)

export const createVisit = (data: Record<string, unknown>) =>
  api.post('/visits', data).then((r) => r.data)

export const getActivities = (params?: Record<string, string>) =>
  api.get('/activities', { params }).then((r) => r.data)

export const checkIn = (id: string) =>
  api.post(`/activities/${id}/check-in`).then((r) => r.data)

export const bulkCheckIn = (data: Record<string, unknown>) =>
  api.post('/activities/bulk-check-in', data).then((r) => r.data)

export const getTrends = (params?: Record<string, string>) =>
  api.get('/dashboard/trends', { params }).then((r) => r.data)

export const getAlerts = () =>
  api.get('/dashboard/alerts').then((r) => r.data)
