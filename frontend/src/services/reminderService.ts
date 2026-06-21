import api from './api';
import type { Reminder } from '../types';
import { ReminderType } from '../types';

export const reminderService = {
  create: (data: { hearingId: string; reminderType: ReminderType; remindAt: string; targetUserId: string; message?: string }) =>
    api.post<Reminder>('/reminders', data).then(r => r.data),
  getByHearing: (hearingId: string) => api.get<Reminder[]>(`/reminders/hearing/${hearingId}`).then(r => r.data),
  getPending: () => api.get<Reminder[]>('/reminders/pending').then(r => r.data),
};
