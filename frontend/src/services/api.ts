import axios from 'axios'
import type {
  Reservation,
  ReservationListResponse,
  TimeSlot,
  CapacityRule,
  ConflictRecord,
  ConflictListResponse,
  TimelineRecord,
  RescheduleRecord,
  AttendanceStats,
  StatsSummary,
} from '@/types'

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

export const reservationApi = {
  getList: (params: {
    page?: number
    page_size?: number
    time_slot_id?: number
    status?: string
    visitor_name?: string
    visitor_phone?: string
    start_date?: string
    end_date?: string
  }) => api.get<any, ReservationListResponse>('/reservations', { params }),

  getDetail: (id: number) => api.get<any, Reservation>(`/reservations/${id}`),

  create: (data: {
    time_slot_id: number
    visitor_name: string
    visitor_phone: string
    visitor_count: number
    ticket_type?: string
    source?: string
    remark?: string
  }) => api.post<any, Reservation>('/reservations', data),

  update: (id: number, data: any) => api.put<any, Reservation>(`/reservations/${id}`, data),

  delete: (id: number) => api.delete<any, { message: string }>(`/reservations/${id}`),

  checkIn: (id: number) => api.post<any, Reservation>(`/reservations/${id}/check-in`),

  getTimeline: (id: number) =>
    api.get<any, TimelineRecord[]>(`/reservations/${id}/timeline`),

  getRescheduleHistory: (id: number) =>
    api.get<any, RescheduleRecord[]>(`/reservations/${id}/reschedule-history`),

  reschedule: (id: number, data: { new_time_slot_id: number; reason?: string }) =>
    api.post<any, RescheduleRecord>(`/reservations/${id}/reschedule`, data),

  batchOperation: (operation: string, reservationIds: number[]) =>
    api.post<any, { message: string }>('/reservations/batch', null, {
      params: { operation, reservation_ids: reservationIds },
    }),
}

export const timeSlotApi = {
  getList: (params?: {
    start_date?: string
    end_date?: string
    is_active?: boolean
  }) => api.get<any, TimeSlot[]>('/time-slots', { params }),

  getDetail: (id: number) => api.get<any, TimeSlot>(`/time-slots/${id}`),

  create: (data: any) => api.post<any, TimeSlot>('/time-slots', data),

  update: (id: number, data: any) => api.put<any, TimeSlot>(`/time-slots/${id}`, data),

  delete: (id: number) => api.delete<any, { message: string }>(`/time-slots/${id}`),

  getCapacityRules: (slotId: number) =>
    api.get<any, CapacityRule[]>(`/time-slots/${slotId}/capacity-rules`),

  createCapacityRule: (slotId: number, data: any) =>
    api.post<any, CapacityRule>(`/time-slots/${slotId}/capacity-rules`, data),

  updateCapacityRule: (ruleId: number, data: any) =>
    api.put<any, CapacityRule>(`/time-slots/capacity-rules/${ruleId}`, data),

  deleteCapacityRule: (ruleId: number) =>
    api.delete<any, { message: string }>(`/time-slots/capacity-rules/${ruleId}`),
}

export const conflictApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    status?: string
    severity?: string
    time_slot_id?: number
    assigned_to?: number
  }) => api.get<any, ConflictListResponse>('/conflicts', { params }),

  getDetail: (id: number) => api.get<any, ConflictRecord>(`/conflicts/${id}`),

  create: (data: {
    time_slot_id: number
    conflict_type: string
    description?: string
    severity?: string
    affected_reservations?: number[]
  }) => api.post<any, ConflictRecord>('/conflicts', data),

  update: (id: number, data: any) =>
    api.put<any, ConflictRecord>(`/conflicts/${id}`, data),

  addNote: (id: number, note: string, operatorId?: number) =>
    api.post<any, { message: string }>(`/conflicts/${id}/add-note`, null, {
      params: { note, operator_id: operatorId },
    }),

  detect: (timeSlotId?: number) =>
    api.post<any, { conflicts_found: number; details: any[] }>('/conflicts/detect', null, {
      params: timeSlotId ? { time_slot_id: timeSlotId } : undefined,
    }),
}

export const statsApi = {
  getAttendance: (params?: { start_date?: string; end_date?: string }) =>
    api.get<any, AttendanceStats[]>('/stats/attendance', { params }),

  getSummary: () => api.get<any, StatsSummary>('/stats/summary'),
}

export const timelineApi = {
  addRecord: (reservationId: number, data: {
    event_type: string
    description?: string
    operator_id?: number
  }) => api.post<any, TimelineRecord>(`/reservations/${reservationId}/timeline`, null, {
    params: data,
  }),

  uploadAttachments: (timelineId: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return api.post<any, any[]>(`/timeline/${timelineId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default api
