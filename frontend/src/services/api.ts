import axios from 'axios';
import type {
  SettlementBill,
  SettlementBillDetail,
  PagedResult,
  BillListQuery,
  CreateSettlementBill,
  UpdateSettlementBill,
  TreatmentCalendar,
  DeviceDto,
  DeviceUsageRecord,
  NursingLog,
  ExceptionRecord,
  SupplementMaterial,
  DashboardDto,
  StatusOverview,
  SourceChannelStatistics,
  TrainingCompletionRate,
  AssigneeStatistics,
  ReviewTagStatistics,
  PatientDto,
  SourceChannelDto,
  UserDto,
  RejectionReasonDto,
  ReviewTagDto,
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const settlementApi = {
  getList: (params: BillListQuery) =>
    api.get<PagedResult<SettlementBill>>('/SettlementBills', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<SettlementBill>(`/SettlementBills/${id}`).then((r) => r.data),

  getDetail: (id: number) =>
    api.get<SettlementBillDetail>(`/SettlementBills/${id}/detail`).then((r) => r.data),

  create: (data: CreateSettlementBill) =>
    api.post<SettlementBill>('/SettlementBills', data).then((r) => r.data),

  update: (id: number, data: UpdateSettlementBill) =>
    api.put<SettlementBill>(`/SettlementBills/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/SettlementBills/${id}`).then((r) => r.data),

  submit: (id: number) =>
    api.post<SettlementBill>(`/SettlementBills/${id}/submit`).then((r) => r.data),

  review: (id: number, approved: boolean, remark?: string) =>
    api.post<SettlementBill>(`/SettlementBills/${id}/review`, { approved, remark }).then((r) => r.data),

  process: (id: number) =>
    api.post<SettlementBill>(`/SettlementBills/${id}/process`).then((r) => r.data),

  finalReview: (id: number, approved: boolean, remark?: string) =>
    api.post<SettlementBill>(`/SettlementBills/${id}/final-review`, { approved, remark }).then((r) => r.data),

  close: (id: number, remark?: string) =>
    api.post<SettlementBill>(`/SettlementBills/${id}/close`, { remark }).then((r) => r.data),

  assign: (id: number, assigneeId: number) =>
    api.post<SettlementBill>(`/SettlementBills/${id}/assign`, { assigneeId }).then((r) => r.data),

  addTags: (id: number, tagIds: number[]) =>
    api.post(`/SettlementBills/${id}/tags`, { tagIds }).then((r) => r.data),

  removeTag: (id: number, tagId: number) =>
    api.delete(`/SettlementBills/${id}/tags/${tagId}`).then((r) => r.data),
};

export const treatmentApi = {
  getByBillId: (billId: number) =>
    api.get<TreatmentCalendar[]>(`/TreatmentCalendar/bill/${billId}`).then((r) => r.data),

  getByPatientId: (patientId: number, startDate?: string, endDate?: string) =>
    api.get<TreatmentCalendar[]>(`/TreatmentCalendar/patient/${patientId}`, {
      params: { startDate, endDate },
    }).then((r) => r.data),

  getById: (id: number) =>
    api.get<TreatmentCalendar>(`/TreatmentCalendar/${id}`).then((r) => r.data),

  create: (data: any) =>
    api.post<TreatmentCalendar>('/TreatmentCalendar', data).then((r) => r.data),

  update: (id: number, data: any) =>
    api.put<TreatmentCalendar>(`/TreatmentCalendar/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/TreatmentCalendar/${id}`).then((r) => r.data),
};

export const deviceApi = {
  getAll: () => api.get<DeviceDto[]>('/Devices').then((r) => r.data),

  getById: (id: number) => api.get<DeviceDto>(`/Devices/${id}`).then((r) => r.data),

  getUsageByBillId: (billId: number) =>
    api.get<DeviceUsageRecord[]>(`/Devices/usage/bill/${billId}`).then((r) => r.data),

  getUsageByDeviceId: (deviceId: number) =>
    api.get<DeviceUsageRecord[]>(`/Devices/usage/device/${deviceId}`).then((r) => r.data),

  addUsageRecord: (data: DeviceUsageRecord) =>
    api.post<DeviceUsageRecord>('/Devices/usage', data).then((r) => r.data),
};

export const nursingApi = {
  getByBillId: (billId: number) =>
    api.get<NursingLog[]>(`/NursingLogs/bill/${billId}`).then((r) => r.data),

  getByPatientId: (patientId: number) =>
    api.get<NursingLog[]>(`/NursingLogs/patient/${patientId}`).then((r) => r.data),

  getById: (id: number) => api.get<NursingLog>(`/NursingLogs/${id}`).then((r) => r.data),

  create: (data: any) =>
    api.post<NursingLog>('/NursingLogs', data).then((r) => r.data),

  update: (id: number, data: any) =>
    api.put<NursingLog>(`/NursingLogs/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/NursingLogs/${id}`).then((r) => r.data),
};

export const exceptionApi = {
  getList: (params?: { billId?: number; isClosed?: boolean }) =>
    api.get<ExceptionRecord[]>('/Exceptions', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<ExceptionRecord>(`/Exceptions/${id}`).then((r) => r.data),

  create: (data: any) =>
    api.post<ExceptionRecord>('/Exceptions', data).then((r) => r.data),

  handle: (data: {
    exceptionRecordId: number;
    handleMethod: string;
    handleRemark?: string;
    handlerId?: number;
    escalatedTo?: number;
    supplementMaterials?: any[];
  }) => api.post<ExceptionRecord>('/Exceptions/handle', data).then((r) => r.data),

  close: (data: { exceptionRecordId: number; closeRemark?: string; closedById?: number }) =>
    api.post<ExceptionRecord>('/Exceptions/close', data).then((r) => r.data),

  addSupplementMaterial: (exceptionId: number, billId: number, data: any) =>
    api.post<SupplementMaterial>(`/Exceptions/${exceptionId}/supplement-materials`, data, {
      params: { billId },
    }).then((r) => r.data),
};

export const statisticsApi = {
  getDashboard: (startDate?: string, endDate?: string) =>
    api.get<DashboardDto>('/Statistics/dashboard', { params: { startDate, endDate } }).then((r) => r.data),

  getTrainingCompletionRate: (startDate?: string, endDate?: string) =>
    api.get<TrainingCompletionRate>('/Statistics/training-completion-rate', {
      params: { startDate, endDate },
    }).then((r) => r.data),

  getSourceChannelStats: (startDate?: string, endDate?: string) =>
    api.get<SourceChannelStatistics[]>('/Statistics/source-channels', {
      params: { startDate, endDate },
    }).then((r) => r.data),

  getAssigneeStats: (startDate?: string, endDate?: string) =>
    api.get<AssigneeStatistics[]>('/Statistics/assignees', {
      params: { startDate, endDate },
    }).then((r) => r.data),

  getReviewTagStats: (startDate?: string, endDate?: string) =>
    api.get<ReviewTagStatistics[]>('/Statistics/review-tags', {
      params: { startDate, endDate },
    }).then((r) => r.data),

  getStatusOverview: (startDate?: string, endDate?: string) =>
    api.get<StatusOverview[]>('/Statistics/status-overview', {
      params: { startDate, endDate },
    }).then((r) => r.data),
};

export const referenceDataApi = {
  getPatients: (keyword?: string) =>
    api.get<PatientDto[]>('/ReferenceData/patients', { params: { keyword } }).then((r) => r.data),

  getPatient: (id: number) =>
    api.get<PatientDto>(`/ReferenceData/patients/${id}`).then((r) => r.data),

  getSourceChannels: () =>
    api.get<SourceChannelDto[]>('/ReferenceData/source-channels').then((r) => r.data),

  getUsers: (role?: string) =>
    api.get<UserDto[]>('/ReferenceData/users', { params: { role } }).then((r) => r.data),

  getRejectionReasons: () =>
    api.get<RejectionReasonDto[]>('/ReferenceData/rejection-reasons').then((r) => r.data),

  getReviewTags: () =>
    api.get<ReviewTagDto[]>('/ReferenceData/review-tags').then((r) => r.data),
};

export default api;
