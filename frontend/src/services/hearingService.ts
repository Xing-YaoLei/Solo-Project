import api from './api';
import type { HearingSchedule, PagedResult, CalendarSlot } from '../types';
import { HearingStatus } from '../types';

export const hearingService = {
  getById: (id: string) => api.get<HearingSchedule>(`/hearings/${id}`).then(r => r.data),
  getList: (params: { page: number; pageSize: number; status?: HearingStatus; fromDate?: string; toDate?: string; courtRoom?: string; conflictFlagged?: boolean }) =>
    api.get<PagedResult<HearingSchedule>>('/hearings', { params }).then(r => r.data),
  create: (data: any) => api.post<HearingSchedule>('/hearings', data).then(r => r.data),
  update: (id: string, data: any) => api.put<HearingSchedule>(`/hearings/${id}`, data).then(r => r.data),
  changeStatus: (id: string, status: HearingStatus, reason?: string, relatedAttachmentId?: string) =>
    api.patch(`/hearings/${id}/status`, { status, reason, relatedAttachmentId }).then(r => r.data),
  batchChangeStatus: (hearingIds: string[], status: HearingStatus, reason?: string) =>
    api.post('/hearings/batch/status', { hearingIds, status, reason }).then(r => r.data),
  delete: (id: string) => api.delete(`/hearings/${id}`),
  getAvailableSlots: (id: string) => api.get<CalendarSlot[]>(`/hearings/${id}/available-slots`).then(r => r.data),
};
