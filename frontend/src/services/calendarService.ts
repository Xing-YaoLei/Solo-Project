import api from './api';
import type { CalendarSlot, CapacityRule } from '../types';

export const calendarService = {
  createSlot: (data: { date: string; startTime: string; endTime: string; courtRoom: string; maxCapacity: number }) =>
    api.post<CalendarSlot>('/calendar/slots', data).then(r => r.data),
  getSlots: (from: string, to: string, courtRoom?: string) =>
    api.get<CalendarSlot[]>('/calendar/slots', { params: { from, to, courtRoom } }).then(r => r.data),
  createCapacityRule: (data: { courtRoom: string; maxHearingsPerSlot: number; maxParticipantsPerHearing: number; effectiveFrom: string; effectiveTo?: string }) =>
    api.post<CapacityRule>('/calendar/capacity-rules', data).then(r => r.data),
  getActiveCapacityRules: () => api.get<CapacityRule[]>('/calendar/capacity-rules').then(r => r.data),
  validateCapacity: (date: string, courtRoom: string) =>
    api.get<boolean>('/calendar/capacity/validate', { params: { date, courtRoom } }).then(r => r.data),
};
