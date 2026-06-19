import axios, { AxiosResponse } from 'axios'
import {
  BookingRecord, BookingQuery, ConflictLog, ConflictStatus, MonthlyStatistics,
  Notification, PagedResult, ReminderList, ReminderListChangeLog,
  ScenicSpot, TicketType, TimeSlot, Visitor,
} from '../types'
import dayjs, { Dayjs } from 'dayjs'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
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

function formatDate(d?: string | Dayjs | null): string | undefined {
  if (!d) return undefined
  return dayjs(d as any).format('YYYY-MM-DD')
}

function formatDateTime(d?: string | Dayjs | null): string | undefined {
  if (!d) return undefined
  return dayjs(d as any).toISOString()
}

// ========= 预约（Bookings） =========
export const bookingApi = {
  getPagedBookings: (query: BookingQuery): Promise<PagedResult<BookingRecord>> =>
    api.get('/bookings', {
      params: {
        scenicSpotId: query.scenicSpotId,
        startDate: formatDate(query.startDate),
        endDate: formatDate(query.endDate),
        status: query.status,
        searchKeyword: query.searchKeyword,
        hasConflict: query.hasConflict,
        pageIndex: query.pageIndex,
        pageSize: query.pageSize,
      },
    }).then((r) => r.data),

  getBooking: (id: string): Promise<BookingRecord> =>
    api.get(`/bookings/${id}`).then((r) => r.data),

  createBooking: (data: {
    scenicSpotId: string
    timeSlotId: string
    ticketTypeId: string
    visitorId?: string
    visitorName?: string
    visitorIdCard?: string
    visitorPhone?: string
    quantity: number
    remarks?: string
    slotDate?: string | Dayjs
    createdBy?: string
  }): Promise<BookingRecord> =>
    api.post('/bookings', {
      scenicSpotId: data.scenicSpotId,
      timeSlotId: data.timeSlotId,
      ticketTypeId: data.ticketTypeId,
      visitorId: data.visitorId ? (data.visitorId as any === '' ? undefined : data.visitorId) : undefined,
      visitorName: data.visitorName,
      visitorIdCard: data.visitorIdCard,
      visitorPhone: data.visitorPhone,
      quantity: data.quantity ?? 1,
      remarks: data.remarks,
      createdBy: data.createdBy || '运营管理员',
    }).then((r) => r.data),

  rescheduleBooking: (id: string, data: {
    newTimeSlotId?: string
    newScenicSpotId?: string
    newSlotDate?: string | Dayjs
    reason?: string
    operatorName?: string
  }): Promise<BookingRecord> =>
    api.post(`/bookings/${id}/reschedule`, {
      newTimeSlotId: data.newTimeSlotId,
      newScenicSpotId: data.newScenicSpotId,
      newSlotDate: data.newSlotDate ? formatDate(data.newSlotDate) : undefined,
      reason: data.reason,
      operatorName: data.operatorName || '运营管理员',
    }).then((r) => r.data),

  markArrival: (id: string, data?: {
    arrivalTime?: string | Dayjs
    operatorName?: string
  }): Promise<BookingRecord> =>
    api.post(`/bookings/${id}/mark-arrival`, {
      arrivalTime: data?.arrivalTime ? formatDateTime(data.arrivalTime) : dayjs().toISOString(),
      operatorName: (data?.operatorName) || '运营管理员',
    }).then((r) => r.data),

  cancelBooking: (id: string, reason: string, operator?: string): Promise<BookingRecord> =>
    api.post(`/bookings/${id}/cancel`, {
      reason,
      operatorName: operator || '运营管理员',
    }).then((r) => r.data),

  precheckConflicts: (data: {
    scenicSpotId: string
    timeSlotId?: string
    visitorId?: string
    visitorIdCard?: string
    quantity?: number
    slotDate?: string | Dayjs
  }): Promise<{ hasWarnings: boolean; warnings: string[] }> =>
    api.post('/bookings/precheck-conflicts', {
      scenicSpotId: data.scenicSpotId,
      timeSlotId: data.timeSlotId || '00000000-0000-0000-0000-000000000000',
      visitorId: data.visitorId,
      visitorIdCard: data.visitorIdCard,
      quantity: data.quantity ?? 1,
      slotDate: data.slotDate ? formatDate(data.slotDate) : undefined,
    }).then((r) => r.data),
}

// ========= 冲突（Conflicts） =========
export const conflictApi = {
  getActiveConflicts: (params?: {
    scenicSpotId?: string
    status?: ConflictStatus
    conflictType?: number
    pageIndex?: number
    pageSize?: number
  }): Promise<PagedResult<ConflictLog>> =>
    api.get('/conflicts/active', { params }).then((r) => r.data),

  getConflict: (id: string): Promise<ConflictLog> =>
    api.get(`/conflicts/${id}`).then((r) => r.data),

  processConflict: (id: string, data: {
    action?: string
    status?: number
    resolveAction: string
    processedBy?: string
  }): Promise<ConflictLog> =>
    api.post(`/conflicts/${id}/process`, {
      action: data.action,
      status: data.status,
      resolveAction: data.resolveAction,
      processedBy: data.processedBy || '运营管理员',
    }).then((r) => r.data),

  triggerDetection: (): Promise<any> =>
    api.post('/conflicts/trigger-detection').then((r) => r.data),
}

// ========= 提醒名单（ReminderLists） =========
export const reminderListApi = {
  getLists: (params?: {
    searchKeyword?: string
    pageIndex?: number
    pageSize?: number
  }): Promise<PagedResult<ReminderList>> =>
    api.get('/reminderlists', { params }).then((r) => r.data),

  getList: (id: string): Promise<ReminderList> =>
    api.get(`/reminderlists/${id}`).then((r) => r.data),

  createList: (data: any): Promise<ReminderList> =>
    api.post('/reminderlists', {
      ...data,
      changeReason: data.changeReason || '创建名单',
      changedBy: data.changedBy || '运营管理员',
    }).then((r) => r.data),

  updateList: (id: string, data: any): Promise<ReminderList> =>
    api.put(`/reminderlists/${id}`, {
      ...data,
      changeReason: data.changeReason || '更新名单',
      changedBy: data.changedBy || '运营管理员',
    }).then((r) => r.data),

  deleteList: (id: string): Promise<void> =>
    api.delete(`/reminderlists/${id}`).then((r) => r.data),

  getChangeLogs: (
    id: string,
    params?: { pageIndex?: number; pageSize?: number },
  ): Promise<PagedResult<ReminderListChangeLog>> =>
    api.get(`/reminderlists/${id}/change-logs`, { params }).then((r) => r.data),
}

// ========= 通知（Notifications） =========
export const notificationApi = {
  getNotifications: (params?: {
    channel?: number
    isRead?: boolean
    pageIndex?: number
    pageSize?: number
  }): Promise<PagedResult<Notification>> =>
    api.get('/notifications', { params }).then((r) => r.data),

  getUnreadCount: (): Promise<number> =>
    api.get('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string): Promise<void> =>
    api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: (recipient?: string): Promise<void> =>
    api.put('/notifications/read-all' + (recipient ? `?recipient=${encodeURIComponent(recipient)}` : '')).then((r) => r.data),

  sendCustom: (data: any): Promise<Notification> =>
    api.post('/notifications/send', {
      ...data,
      createdBy: data.createdBy || '运营管理员',
    }).then((r) => r.data),
}

// ========= 月底复盘统计 & 导出（Statistics） =========
export const statisticsApi = {
  getMonthlyStatistics: (
    year: number,
    month: number,
    scenicSpotId?: string,
  ): Promise<MonthlyStatistics> =>
    api.get(`/statistics/monthly/${year}/${month}`, {
      params: scenicSpotId ? { scenicSpotId } : undefined,
    }).then((r) => r.data),

  exportBookings: (data: {
    filterCriteria?: {
      scenicSpotId?: string
      status?: number
      startDate?: string | Dayjs | null
      endDate?: string | Dayjs | null
      searchKeyword?: string
      year?: number
      month?: number
    }
    format?: string
    generatedBy?: string
  }): Promise<AxiosResponse<Blob>> => {
    const payload: any = {
      filterCriteria: data.filterCriteria
        ? {
            scenicSpotId: data.filterCriteria.scenicSpotId,
            status: data.filterCriteria.status,
            startDate: formatDate(data.filterCriteria.startDate as any),
            endDate: formatDate(data.filterCriteria.endDate as any),
            searchKeyword: data.filterCriteria.searchKeyword,
            year: data.filterCriteria.year,
            month: data.filterCriteria.month,
          }
        : undefined,
      format: data.format || 'excel',
      generatedBy: data.generatedBy || '运营管理员',
    }
    return api.post('/statistics/export/bookings', payload, {
      responseType: 'blob',
    })
  },

  exportMonthlyReport: (data: {
    year: number
    month: number
    scenicSpotId?: string
    filterCriteria?: {
      year?: number
      month?: number
      scenicSpotId?: string
      status?: number
    }
    format?: string
    generatedBy?: string
  }): Promise<AxiosResponse<Blob>> => {
    const payload: any = {
      year: data.year,
      month: data.month,
      scenicSpotId: data.scenicSpotId,
      filterCriteria: data.filterCriteria,
      format: data.format || 'excel',
      generatedBy: data.generatedBy || '运营管理员',
    }
    return api.post('/statistics/export/monthly-report', payload, {
      responseType: 'blob',
    })
  },
}

// ========= 主数据（MasterData） =========
export const masterDataApi = {
  getScenicSpots: (): Promise<ScenicSpot[]> =>
    api.get('/masterdata/scenicspots').then((r) => r.data),

  createScenicSpot: (data: any): Promise<ScenicSpot> =>
    api.post('/masterdata/scenicspots', data).then((r) => r.data),

  updateScenicSpot: (id: string, data: any): Promise<ScenicSpot> =>
    api.put(`/masterdata/scenicspots/${id}`, data).then((r) => r.data),

  getTimeSlots: (
    scenicSpotId: string,
    date?: string | Dayjs,
    startDate?: string | Dayjs,
    endDate?: string | Dayjs,
  ): Promise<TimeSlot[]> =>
    api.get(`/masterdata/scenicspots/${scenicSpotId}/timeslots`, {
      params: {
        date: formatDate(date),
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      },
    }).then((r) => r.data),

  bulkTimeSlots: (data: {
    scenicSpotId: string
    startDate: string | Dayjs
    endDate: string | Dayjs
    capacity?: number
    timeRanges: { startTime: string; endTime: string }[]
  }): Promise<TimeSlot[]> =>
    api.post('/masterdata/timeslots/bulk-generate', {
      scenicSpotId: data.scenicSpotId,
      startDate: formatDate(data.startDate),
      endDate: formatDate(data.endDate),
      capacity: data.capacity ?? 100,
      timeRanges: data.timeRanges,
    }).then((r) => r.data),

  getTicketTypes: (scenicSpotId?: string): Promise<TicketType[]> =>
    api.get('/masterdata/tickettypes', {
      params: scenicSpotId ? { scenicSpotId } : undefined,
    }).then((r) => r.data),

  createTicketType: (data: any): Promise<TicketType> =>
    api.post('/masterdata/tickettypes', data).then((r) => r.data),

  getVisitors: (params?: {
    keyword?: string
    pageIndex?: number
    pageSize?: number
  }): Promise<PagedResult<Visitor>> =>
    api.get('/masterdata/visitors', { params }).then((r) => r.data),

  createVisitor: (data: any): Promise<Visitor> =>
    api.post('/masterdata/visitors', data).then((r) => r.data),

  updateVisitor: (id: string, data: any): Promise<Visitor> =>
    api.put(`/masterdata/visitors/${id}`, data).then((r) => r.data),
}

export default api
