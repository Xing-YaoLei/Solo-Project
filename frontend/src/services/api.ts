import axios from 'axios'
import { BookingRecord, BookingQuery, ConflictLog, ConflictStatus, MonthlyStatistics, Notification, PagedResult, ReminderList, ReminderListChangeLog, ScenicSpot, TicketType, TimeSlot, Visitor } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export const bookingApi = {
  getPagedBookings: (query: BookingQuery): Promise<PagedResult<BookingRecord>> =>
    api.get('/bookings', { params: query }).then((r) => r.data),
  getBooking: (id: string): Promise<BookingRecord> =>
    api.get(`/bookings/${id}`).then((r) => r.data),
  createBooking: (data: any): Promise<BookingRecord> =>
    api.post('/bookings', data).then((r) => r.data),
  rescheduleBooking: (id: string, data: any): Promise<BookingRecord> =>
    api.post(`/bookings/${id}/reschedule`, data).then((r) => r.data),
  markArrival: (id: string, data: any): Promise<BookingRecord> =>
    api.post(`/bookings/${id}/mark-arrival`, data).then((r) => r.data),
  cancelBooking: (id: string, reason: string, operator: string): Promise<BookingRecord> =>
    api.post(`/bookings/${id}/cancel`, { reason, operatorName: operator }).then((r) => r.data),
  precheckConflicts: (data: any): Promise<any> =>
    api.post('/bookings/precheck-conflicts', data).then((r) => r.data),
}

export const conflictApi = {
  getActiveConflicts: (params?: any): Promise<PagedResult<ConflictLog>> =>
    api.get('/conflicts/active', { params }).then((r) => r.data),
  getConflict: (id: string): Promise<ConflictLog> =>
    api.get(`/conflicts/${id}`).then((r) => r.data),
  processConflict: (id: string, data: any): Promise<ConflictLog> =>
    api.post(`/conflicts/${id}/process`, data).then((r) => r.data),
  triggerDetection: (data?: any): Promise<any> =>
    api.post('/conflicts/trigger-detection', data).then((r) => r.data),
}

export const reminderListApi = {
  getLists: (params?: any): Promise<PagedResult<ReminderList>> =>
    api.get('/reminderlists', { params }).then((r) => r.data),
  getList: (id: string): Promise<ReminderList> =>
    api.get(`/reminderlists/${id}`).then((r) => r.data),
  createList: (data: any): Promise<ReminderList> =>
    api.post('/reminderlists', data).then((r) => r.data),
  updateList: (id: string, data: any): Promise<ReminderList> =>
    api.put(`/reminderlists/${id}`, data).then((r) => r.data),
  deleteList: (id: string): Promise<void> =>
    api.delete(`/reminderlists/${id}`).then((r) => r.data),
  getChangeLogs: (id: string, params?: any): Promise<PagedResult<ReminderListChangeLog>> =>
    api.get(`/reminderlists/${id}/change-logs`, { params }).then((r) => r.data),
}

export const notificationApi = {
  getNotifications: (params?: any): Promise<PagedResult<Notification>> =>
    api.get('/notifications', { params }).then((r) => r.data),
  getUnreadCount: (): Promise<number> =>
    api.get('/notifications/unread-count').then((r) => r.data),
  markAsRead: (id: string): Promise<void> =>
    api.post(`/notifications/${id}/mark-read`).then((r) => r.data),
  markAllAsRead: (): Promise<void> =>
    api.post('/notifications/mark-all-read').then((r) => r.data),
  sendCustom: (data: any): Promise<Notification> =>
    api.post('/notifications/send', data).then((r) => r.data),
}

export const statisticsApi = {
  getMonthlyStatistics: (year: number, month: number, scenicSpotId?: string): Promise<MonthlyStatistics> =>
    api.get(`/statistics/monthly/${year}/${month}`, { params: { scenicSpotId } }).then((r) => r.data),
  exportBookings: (data: any) =>
    api.post('/statistics/export/bookings', data, {
      responseType: 'blob',
      withCredentials: true,
    }),
  exportMonthlyReport: (data: any) =>
    api.post('/statistics/export/monthly-report', data, {
      responseType: 'blob',
      withCredentials: true,
    }),
}

export const masterDataApi = {
  getScenicSpots: (): Promise<ScenicSpot[]> =>
    api.get('/masterdata/scenicspots').then((r) => r.data),
  createScenicSpot: (data: any): Promise<ScenicSpot> =>
    api.post('/masterdata/scenicspots', data).then((r) => r.data),
  updateScenicSpot: (id: string, data: any): Promise<ScenicSpot> =>
    api.put(`/masterdata/scenicspots/${id}`, data).then((r) => r.data),
  getTimeSlots: (scenicSpotId: string, date: string): Promise<TimeSlot[]> =>
    api.get(`/masterdata/scenicspots/${scenicSpotId}/timeslots?date=${date}`).then((r) => r.data),
  bulkTimeSlots: (data: any): Promise<TimeSlot[]> =>
    api.post('/masterdata/timeslots/bulk-generate', data).then((r) => r.data),
  getTicketTypes: (scenicSpotId?: string): Promise<TicketType[]> =>
    api.get('/masterdata/tickettypes', { params: { scenicSpotId } }).then((r) => r.data),
  createTicketType: (data: any): Promise<TicketType> =>
    api.post('/masterdata/tickettypes', data).then((r) => r.data),
  getVisitors: (params?: any): Promise<PagedResult<Visitor>> =>
    api.get('/masterdata/visitors', { params }).then((r) => r.data),
  createVisitor: (data: any): Promise<Visitor> =>
    api.post('/masterdata/visitors', data).then((r) => r.data),
  updateVisitor: (id: string, data: any): Promise<Visitor> =>
    api.put(`/masterdata/visitors/${id}`, data).then((r) => r.data),
}

export default api
