import api from './axios';
import type {
  ProgressAlert,
  PagedResult,
  AlertStatus,
  AlertSeverity,
} from '../types';

export const alertApi = {
  getList: (params: {
    userId?: number;
    status?: AlertStatus;
    severity?: AlertSeverity;
    startDate?: string;
    endDate?: string;
    pageIndex?: number;
    pageSize?: number;
  }) =>
    api.get<PagedResult<ProgressAlert>>('/progressAlerts', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<ProgressAlert>(`/progressAlerts/${id}`).then((r) => r.data),

  getActiveByUser: (userId: number) =>
    api.get<ProgressAlert[]>(`/progressAlerts/user/${userId}/active`).then((r) => r.data),

  getOpenCount: (userId?: number) =>
    api.get<number>('/progressAlerts/count', { params: { userId } }).then((r) => r.data),

  handleAlert: (id: number, data: {
    reason: string;
    actionTaken: string;
    handlerUserId: number;
    newStatus: AlertStatus;
  }) =>
    api.put<ProgressAlert>(`/progressAlerts/${id}/handle`, data).then((r) => r.data),

  triggerCheck: () =>
    api.post<number>('/progressAlerts/check').then((r) => r.data),
};
