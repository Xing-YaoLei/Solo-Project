import axios from 'axios';
import type {
  AuthResponse, ApiResponse, UserInfo,
  DashboardStats, ScheduleSummary, RiskDistribution,
  PagedResult, ScheduleListDto, ScheduleDetailDto,
  ChecklistItemDto, SamplingListDto, CheckRecordListDto,
  RectificationListDto, EvidenceMissingListDto, EvidenceDto,
  ProcessingHistoryDto, ComplianceRateSummary, SamplingCoverageReport,
  DocumentTraceInfo, AuditorPerformance, EvidenceCompletionReport, Regulation
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }).then(r => r.data),
  register: (data: any) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data).then(r => r.data),
  getCurrentUser: () =>
    api.get<ApiResponse<UserInfo>>('/auth/me').then(r => r.data),
  getUsers: () =>
    api.get<ApiResponse<UserInfo[]>>('/auth/users').then(r => r.data),
  getUsersByRole: (role: number) =>
    api.get<ApiResponse<UserInfo[]>>(`/auth/users/role/${role}`).then(r => r.data),
  logout: () =>
    api.post<ApiResponse<boolean>>('/auth/logout').then(r => r.data)
};

export const dashboardApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats').then(r => r.data),
  getScheduleStatusSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<ScheduleSummary[]>>('/dashboard/schedule-status-summary', { params }).then(r => r.data),
  getRiskDistribution: () =>
    api.get<ApiResponse<RiskDistribution[]>>('/dashboard/risk-distribution').then(r => r.data)
};

export const schedulesApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<ScheduleListDto>>>('/schedules', { params }).then(r => r.data),
  mine: () =>
    api.get<ApiResponse<ScheduleListDto[]>>('/schedules/mine').then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<ScheduleDetailDto>>(`/schedules/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post<ApiResponse<number>>('/schedules', data).then(r => r.data),
  update: (data: any) =>
    api.put<ApiResponse<number>>('/schedules', data).then(r => r.data),
  remove: (id: number) =>
    api.delete<ApiResponse<boolean>>(`/schedules/${id}`).then(r => r.data),
  start: (id: number) =>
    api.post<ApiResponse<boolean>>(`/schedules/${id}/start`).then(r => r.data),
  submit: (id: number) =>
    api.post<ApiResponse<boolean>>(`/schedules/${id}/submit`).then(r => r.data),
  review: (data: any) =>
    api.post<ApiResponse<boolean>>('/schedules/review', data).then(r => r.data),
  close: (id: number) =>
    api.post<ApiResponse<boolean>>(`/schedules/${id}/close`).then(r => r.data),
  generateChecklist: (scheduleId: number, templateId: number) =>
    api.post<ApiResponse<boolean>>('/schedules/generate-checklist', { scheduleId, templateId }).then(r => r.data)
};

export const checklistApi = {
  getByScheduleId: (scheduleId: number) =>
    api.get<ApiResponse<ChecklistItemDto[]>>(`/checklist/schedule/${scheduleId}`).then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<ChecklistItemDto>>(`/checklist/${id}`).then(r => r.data),
  update: (data: any) =>
    api.put<ApiResponse<number>>('/checklist', data).then(r => r.data),
  setResult: (itemId: number, isCompliant: boolean, findings?: string) =>
    api.post<ApiResponse<boolean>>('/checklist/set-result', { itemId, isCompliant, findings }).then(r => r.data),
  bulkUpdateStatus: (ids: number[], targetStatus: number, remarks?: string) =>
    api.post<ApiResponse<boolean>>('/checklist/bulk-update-status', { ids, targetStatus, remarks }).then(r => r.data)
};

export const samplingApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<SamplingListDto>>>('/sampling', { params }).then(r => r.data),
  getAllByScheduleId: (scheduleId: number) =>
    api.get<ApiResponse<SamplingListDto[]>>(`/sampling/schedule/${scheduleId}/all`).then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<SamplingListDto>>(`/sampling/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post<ApiResponse<number>>('/sampling', data).then(r => r.data),
  update: (data: any) =>
    api.put<ApiResponse<number>>('/sampling', data).then(r => r.data),
  remove: (id: number) =>
    api.delete<ApiResponse<boolean>>(`/sampling/${id}`).then(r => r.data),
  bulkUpdateStatus: (ids: number[], targetStatus: number, remarks?: string) =>
    api.post<ApiResponse<boolean>>('/sampling/bulk-update-status', { ids, targetStatus, remarks }).then(r => r.data)
};

export const checkRecordsApi = {
  getByScheduleId: (scheduleId: number) =>
    api.get<ApiResponse<CheckRecordListDto[]>>(`/checkrecords/schedule/${scheduleId}`).then(r => r.data),
  getByChecklistItemId: (checklistItemId: number) =>
    api.get<ApiResponse<any[]>>(`/checkrecords/checklist-item/${checklistItemId}`).then(r => r.data),
  getBySamplingId: (samplingId: number) =>
    api.get<ApiResponse<any[]>>(`/checkrecords/sampling/${samplingId}`).then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<any>>(`/checkrecords/${id}`).then(r => r.data),
  getByDocumentNo: (documentNo: string) =>
    api.get<ApiResponse<any[]>>(`/checkrecords/trace/${documentNo}`).then(r => r.data),
  create: (data: any) =>
    api.post<ApiResponse<number>>('/checkrecords', data).then(r => r.data),
  update: (data: any) =>
    api.put<ApiResponse<number>>('/checkrecords', data).then(r => r.data),
  setResult: (data: any) =>
    api.post<ApiResponse<boolean>>('/checkrecords/set-result', data).then(r => r.data),
  submit: (id: number) =>
    api.post<ApiResponse<boolean>>(`/checkrecords/${id}/submit`).then(r => r.data),
  review: (data: any) =>
    api.post<ApiResponse<boolean>>('/checkrecords/review', data).then(r => r.data),
  bulkUpdateStatus: (ids: number[], targetStatus: number, remarks?: string) =>
    api.post<ApiResponse<boolean>>('/checkrecords/bulk-update-status', { ids, targetStatus, remarks }).then(r => r.data)
};

export const rectificationsApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<RectificationListDto>>>('/rectifications', { params }).then(r => r.data),
  getByScheduleId: (scheduleId: number) =>
    api.get<ApiResponse<RectificationListDto[]>>(`/rectifications/schedule/${scheduleId}`).then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<any>>(`/rectifications/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post<ApiResponse<number>>('/rectifications', data).then(r => r.data),
  update: (data: any) =>
    api.put<ApiResponse<number>>('/rectifications', data).then(r => r.data),
  updateStatus: (id: number, status: number, remarks?: string) =>
    api.post<ApiResponse<boolean>>(`/rectifications/${id}/update-status?remarks=${remarks ?? ''}`, status).then(r => r.data),
  submit: (id: number) =>
    api.post<ApiResponse<boolean>>(`/rectifications/${id}/submit`).then(r => r.data),
  verify: (data: any) =>
    api.post<ApiResponse<boolean>>('/rectifications/verify', data).then(r => r.data),
  close: (id: number) =>
    api.post<ApiResponse<boolean>>(`/rectifications/${id}/close`).then(r => r.data)
};

export const evidenceMissingApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<EvidenceMissingListDto>>>('/evidencemissing', { params }).then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<any>>(`/evidencemissing/${id}`).then(r => r.data),
  getByCheckRecordId: (checkRecordId: number) =>
    api.get<ApiResponse<any[]>>(`/evidencemissing/check-record/${checkRecordId}`).then(r => r.data),
  getByScheduleId: (scheduleId: number) =>
    api.get<ApiResponse<any[]>>(`/evidencemissing/schedule/${scheduleId}`).then(r => r.data),
  create: (data: any) =>
    api.post<ApiResponse<number>>('/evidencemissing', data).then(r => r.data),
  requestSupplement: (data: any) =>
    api.post<ApiResponse<boolean>>('/evidencemissing/request-supplement', data).then(r => r.data),
  provideEvidence: (data: any) =>
    api.post<ApiResponse<boolean>>('/evidencemissing/provide-evidence', data).then(r => r.data),
  review: (data: any) =>
    api.post<ApiResponse<boolean>>('/evidencemissing/review', data).then(r => r.data),
  waive: (data: any) =>
    api.post<ApiResponse<boolean>>('/evidencemissing/waive', data).then(r => r.data)
};

export const evidencesApi = {
  getByCheckRecordId: (checkRecordId: number) =>
    api.get<ApiResponse<EvidenceDto[]>>(`/evidences/check-record/${checkRecordId}`).then(r => r.data),
  getByChecklistItemId: (checklistItemId: number) =>
    api.get<ApiResponse<EvidenceDto[]>>(`/evidences/checklist-item/${checklistItemId}`).then(r => r.data),
  getBySamplingId: (samplingId: number) =>
    api.get<ApiResponse<EvidenceDto[]>>(`/evidences/sampling/${samplingId}`).then(r => r.data),
  getByRectificationId: (rectificationId: number) =>
    api.get<ApiResponse<EvidenceDto[]>>(`/evidences/rectification/${rectificationId}`).then(r => r.data),
  getUploadUrl: (fileName: string, contentType: string) =>
    api.get<ApiResponse<any>>('/evidences/upload-url', { params: { fileName, contentType } }).then(r => r.data),
  attach: (data: any) =>
    api.post<ApiResponse<number>>('/evidences/attach', data).then(r => r.data),
  remove: (id: number) =>
    api.delete<ApiResponse<boolean>>(`/evidences/${id}`).then(r => r.data)
};

export const statisticsApi = {
  getComplianceRate: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<ComplianceRateSummary[]>>('/statistics/compliance-rate', { params }).then(r => r.data),
  getSamplingCoverage: (scheduleId: number) =>
    api.get<ApiResponse<SamplingCoverageReport>>(`/statistics/sampling-coverage/${scheduleId}`).then(r => r.data),
  getDocumentTrace: (documentNo: string) =>
    api.get<ApiResponse<DocumentTraceInfo[]>>(`/statistics/document-trace/${documentNo}`).then(r => r.data),
  getAuditorPerformance: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<AuditorPerformance[]>>('/statistics/auditor-performance', { params }).then(r => r.data),
  getRectificationSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<any[]>>('/statistics/rectification-summary', { params }).then(r => r.data),
  getEvidenceCompletion: () =>
    api.get<ApiResponse<EvidenceCompletionReport>>('/statistics/evidence-completion').then(r => r.data)
};

export const regulationsApi = {
  list: (params?: any) =>
    api.get<ApiResponse<PagedResult<Regulation>>>('/regulations', { params }).then(r => r.data),
  get: (id: number) =>
    api.get<ApiResponse<any>>(`/regulations/${id}`).then(r => r.data),
  getTemplates: (id: number) =>
    api.get<ApiResponse<any[]>>(`/regulations/${id}/templates`).then(r => r.data)
};

export const processingHistoryApi = {
  list: (params: any) =>
    api.get<ApiResponse<PagedResult<ProcessingHistoryDto>>>('/processinghistories', { params }).then(r => r.data)
};

export default api;
