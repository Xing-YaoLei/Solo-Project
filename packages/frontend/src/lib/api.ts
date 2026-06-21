import { get, post, put, patch, del, download } from './request';
import {
  Hearing,
  ConflictCheck,
  RescheduleRecord,
  AttendanceRecord,
  StatusTimeline,
  Reminder,
  ExceptionRecord,
  ExportType,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

// ==================== 开庭日历 ====================
export const hearingApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<Hearing>>('/hearings', params),
  calendar: (params: { startTimeFrom: string; startTimeTo: string; [key: string]: any }) =>
    get<Hearing[]>('/hearings/calendar', params),
  detail: (id: string) => get<Hearing>(`/hearings/${id}`),
  create: (data: any) => post<Hearing>('/hearings', data),
  createWithCheck: (data: any) => post<Hearing>('/hearings/create-with-check', data),
  update: (id: string, data: any) => put<Hearing>(`/hearings/${id}`, data),
  delete: (id: string) => del<void>(`/hearings/${id}`),
  updateStatus: (id: string, data: { status: string; reason?: string }) =>
    patch<Hearing>(`/hearings/${id}/status`, data),
  checkConflict: (data: any) =>
    post<{ hasConflict: boolean; conflicts: ConflictCheck[]; details: any[] }>('/hearings/check-conflict', data),
  getTimelines: (id: string) => get<StatusTimeline[]>(`/hearings/${id}/timelines`),
};

// ==================== 冲突检测 ====================
export const conflictApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<ConflictCheck>>('/conflicts', params),
  detail: (id: string) => get<ConflictCheck>(`/conflicts/${id}`),
  create: (data: any) => post<ConflictCheck>('/conflicts', data),
  update: (id: string, data: any) => patch<ConflictCheck>(`/conflicts/${id}`, data),
  delete: (id: string) => del<void>(`/conflicts/${id}`),
  resolve: (id: string, data: { resolution: string; resolvedBy?: string }) =>
    post<ConflictCheck>(`/conflicts/${id}/resolve`, data),
  bulkResolve: (data: { ids: string[]; resolution: string; resolvedBy?: string }) =>
    post<ConflictCheck[]>('/conflicts/bulk-resolve', data),
  detect: (data: any) =>
    post<{ hasConflict: boolean; conflicts: ConflictCheck[] }>('/conflicts/detect', data),
  autoCheck: (hearingId: string) =>
    post<{ created: number; conflicts: ConflictCheck[] }>(`/conflicts/hearing/${hearingId}/auto-check`),
  stats: () => get<any>('/conflicts/stats'),
};

// ==================== 改约 ====================
export const rescheduleApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<RescheduleRecord>>('/reschedules', params),
  detail: (id: string) => get<RescheduleRecord>(`/reschedules/${id}`),
  create: (data: any) => post<RescheduleRecord>('/reschedules', data),
  update: (id: string, data: any) => patch<RescheduleRecord>(`/reschedules/${id}`, data),
  delete: (id: string) => del<void>(`/reschedules/${id}`),
  approve: (id: string, data: { isApproved: boolean; approverId?: string }) =>
    post<RescheduleRecord>(`/reschedules/${id}/approve`, data),
  getAffectedParties: (hearingId: string) =>
    get<any[]>(`/reschedules/hearing/${hearingId}/affected-parties`),
  getHistory: (hearingId: string) =>
    get<RescheduleRecord[]>(`/reschedules/hearing/${hearingId}/history`),
  linkHearing: (rescheduleId: string, newHearingId: string) =>
    post<void>(`/reschedules/${rescheduleId}/link-hearing/${newHearingId}`),
  stats: () => get<any>('/reschedules/stats'),
};

// ==================== 到场签到 ====================
export const attendanceApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<AttendanceRecord>>('/attendance', params),
  detail: (id: string) => get<AttendanceRecord>(`/attendance/${id}`),
  checkIn: (data: any) => post<AttendanceRecord>('/attendance/check-in', data),
  checkOut: (data: any) => post<AttendanceRecord>('/attendance/check-out', data),
  batchRegister: (data: any) => post<AttendanceRecord[]>('/attendance/batch-register', data),
  updateStatus: (id: string, data: { status: string; remark?: string }) =>
    patch<AttendanceRecord>(`/attendance/${id}/status`, data),
  delete: (id: string) => del<void>(`/attendance/${id}`),
  stats: (params?: any) => get<any>('/attendance/stats', params),
};

// ==================== 时间线 ====================
export const timelineApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<StatusTimeline>>('/timeline', params),
  byHearing: (hearingId: string, params?: PaginationParams) =>
    get<StatusTimeline[]>(`/timeline/hearing/${hearingId}`, params),
  detail: (id: string) => get<StatusTimeline>(`/timeline/${id}`),
  create: (data: any) => post<StatusTimeline>('/timeline', data),
  delete: (id: string) => del<void>(`/timeline/${id}`),
  changeTypes: () => get<any[]>('/timeline/change-types'),
};

// ==================== 提醒 ====================
export const reminderApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<Reminder>>('/reminders', params),
  detail: (id: string) => get<Reminder>(`/reminders/${id}`),
  create: (data: any) => post<Reminder>('/reminders', data),
  update: (id: string, data: any) => patch<Reminder>(`/reminders/${id}`, data),
  delete: (id: string) => del<void>(`/reminders/${id}`),
  send: (data: { ids?: string[] }) => post<{ sent: number; failed: number }>('/reminders/send', data),
  resend: (id: string) => post<Reminder>(`/reminders/${id}/resend`),
  stats: () => get<any>('/reminders/stats'),
};

// ==================== 异常单 ====================
export const exceptionApi = {
  list: (params?: PaginationParams & any) =>
    get<PaginatedResponse<ExceptionRecord>>('/exceptions', params),
  detail: (id: string) => get<ExceptionRecord>(`/exceptions/${id}`),
  create: (data: any) => post<ExceptionRecord>('/exceptions', data),
  update: (id: string, data: any) => patch<ExceptionRecord>(`/exceptions/${id}`, data),
  delete: (id: string) => del<void>(`/exceptions/${id}`),
  addTimeline: (id: string, data: any) =>
    post<ExceptionRecord>(`/exceptions/${id}/timeline`, data),
  stats: () => get<any>('/exceptions/stats'),
};

// ==================== 导出 ====================
export const exportApi = {
  hearingSummary: (params: any) =>
    download('/exports/hearing-summary', params, `开庭汇总_${Date.now()}.xlsx`),
  attendanceStats: (params: any) =>
    download('/exports/attendance-stats', params, `签到统计_${Date.now()}.xlsx`),
  exceptionStats: (params: any) =>
    download('/exports/exception-stats', params, `异常统计_${Date.now()}.xlsx`),
  conflictStats: (params: any) =>
    download('/exports/conflict-stats', params, `冲突统计_${Date.now()}.xlsx`),
  reminderSummary: (params: any) =>
    download('/exports/reminder-summary', params, `提醒汇总_${Date.now()}.xlsx`),
  records: (params?: PaginationParams & any) =>
    get<PaginatedResponse<any>>('/exports/records', params),
  calibers: () => get<{ type: ExportType; fields: any[]; generalCalibers: string[] }[]>('/exports/calibers'),
};
