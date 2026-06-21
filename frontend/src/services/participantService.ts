import api from './api';
import type { Participant } from '../types';
import { AttendanceStatus } from '../types';

export const participantService = {
  add: (hearingId: string, data: { userId: string; role: string }) =>
    api.post<Participant>(`/hearings/${hearingId}/participants`, data).then(r => r.data),
  updateAttendance: (participantId: string, data: { attendanceStatus: AttendanceStatus; checkInTime?: string; notes?: string }) =>
    api.put(`/hearings/participants/${participantId}/attendance`, data).then(r => r.data),
  batchUpdateAttendance: (updates: { participantId: string; attendanceStatus: AttendanceStatus; checkInTime?: string; notes?: string }[]) =>
    api.post('/hearings/participants/batch-attendance', { updates }).then(r => r.data),
  remove: (participantId: string) => api.delete(`/hearings/participants/${participantId}`),
  getByHearing: (hearingId: string) => api.get<Participant[]>(`/hearings/${hearingId}/participants`).then(r => r.data),
};
