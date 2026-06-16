import axios from 'axios';
import { message } from 'antd';
import type {
  MedicationDictionary,
  MedicationSchedule,
  MedicationReminderLog,
  VisitRecordRule,
  VisitRecord,
  ActivityCheckInThreshold,
  ActivityCheckIn,
  ElderlyProfile,
  RiskEvent,
  RiskEventTimeline,
  CombinedQueryParams,
  PagedResult,
  Area,
  Staff,
  CheckInStats,
  RiskEventReminder,
} from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.message || error.message || '请求失败';
    message.error(msg);
    return Promise.reject(error);
  },
);

export const medicationDict = {
  getAll: () => apiClient.get<MedicationDictionary[]>('/medication-dict'),
  getById: (id: number) => apiClient.get<MedicationDictionary>(`/medication-dict/${id}`),
  create: (data: Partial<MedicationDictionary>) => apiClient.post<MedicationDictionary>('/medication-dict', data),
  update: (id: number, data: Partial<MedicationDictionary>) => apiClient.put<MedicationDictionary>(`/medication-dict/${id}`, data),
  remove: (id: number) => apiClient.delete(`/medication-dict/${id}`),
};

export const schedules = {
  getAll: () => apiClient.get<MedicationSchedule[]>('/schedules'),
  getById: (id: number) => apiClient.get<MedicationSchedule>(`/schedules/${id}`),
  create: (data: Partial<MedicationSchedule>) => apiClient.post<MedicationSchedule>('/schedules', data),
  update: (id: number, data: Partial<MedicationSchedule>) => apiClient.put<MedicationSchedule>(`/schedules/${id}`, data),
  getByElderly: (elderlyId: number) => apiClient.get<MedicationSchedule[]>(`/schedules/elderly/${elderlyId}`),
  acknowledge: (logId: number, data: { acknowledgedByStaffId: number; notes?: string }) =>
    apiClient.post(`/schedules/${logId}/acknowledge`, data),
  getReminderLogs: (scheduleId: number) => apiClient.get<MedicationReminderLog[]>(`/schedules/${scheduleId}/reminder-logs`),
};

export const visitRules = {
  getAll: () => apiClient.get<VisitRecordRule[]>('/visit-rules'),
  create: (data: Partial<VisitRecordRule>) => apiClient.post<VisitRecordRule>('/visit-rules', data),
  update: (id: number, data: Partial<VisitRecordRule>) => apiClient.put<VisitRecordRule>(`/visit-rules/${id}`, data),
};

export const visitRecords = {
  getAll: () => apiClient.get<VisitRecord[]>('/visit-records'),
  create: (data: Partial<VisitRecord>) => apiClient.post<VisitRecord>('/visit-records', data),
  getByElderly: (elderlyId: number) => apiClient.get<VisitRecord[]>(`/visit-records/elderly/${elderlyId}`),
};

export const thresholds = {
  getAll: () => apiClient.get<ActivityCheckInThreshold[]>('/activity-thresholds'),
  create: (data: Partial<ActivityCheckInThreshold>) => apiClient.post<ActivityCheckInThreshold>('/activity-thresholds', data),
  update: (id: number, data: Partial<ActivityCheckInThreshold>) => apiClient.put<ActivityCheckInThreshold>(`/activity-thresholds/${id}`, data),
};

export const checkIns = {
  getAll: () => apiClient.get<ActivityCheckIn[]>('/activity-checkins'),
  create: (data: Partial<ActivityCheckIn>) => apiClient.post<ActivityCheckIn>('/activity-checkins', data),
  getStats: (elderlyId?: number) => apiClient.get<CheckInStats[]>('/activity-checkins/stats', { params: { elderlyId } }),
};

export const elderlyApi = {
  getAll: () => apiClient.get<ElderlyProfile[]>('/elderly'),
  getById: (id: number) => apiClient.get<ElderlyProfile>(`/elderly/${id}`),
  create: (data: Partial<ElderlyProfile>) => apiClient.post<ElderlyProfile>('/elderly', data),
  update: (id: number, data: Partial<ElderlyProfile>) => apiClient.put<ElderlyProfile>(`/elderly/${id}`, data),
};
export const elderly = elderlyApi;

export const riskEventsApi = {
  getAll: () => apiClient.get<RiskEvent[]>('/risk-events'),
  getById: (id: number) => apiClient.get<RiskEvent>(`/risk-events/${id}`),
  create: (data: Partial<RiskEvent>) => apiClient.post<RiskEvent>('/risk-events', data),
  update: (id: number, data: Partial<RiskEvent>) => apiClient.put<RiskEvent>(`/risk-events/${id}`, data),
  push: (id: number, data: { message: string; notes?: string }) =>
    apiClient.post<RiskEventReminder>(`/risk-events/${id}/push`, data),
  supplement: (id: number, data: { message: string; notes?: string }) =>
    apiClient.post<RiskEventReminder>(`/risk-events/${id}/supplement`, data),
  retry: (id: number, reminderId: number, data: { message: string; notes?: string }) =>
    apiClient.post<RiskEventReminder>(`/risk-events/${id}/retry/${reminderId}`, data),
  close: (id: number, reminderId: number) =>
    apiClient.post<RiskEventReminder>(`/risk-events/${id}/close/${reminderId}`),
  getTimeline: (id: number) => apiClient.get<RiskEventTimeline>(`/risk-events/${id}/timeline`),
};
export const riskEvents = riskEventsApi;

export const queryApi = {
  combined: (params: CombinedQueryParams) => apiClient.post<PagedResult<any>>('/query/combined', params),
};
export const query = queryApi;

export const areasApi = {
  getAll: () => apiClient.get<Area[]>('/areas'),
};
export const areas = areasApi;

export const staffApi = {
  getAll: () => apiClient.get<Staff[]>('/staff'),
};

export default apiClient;
