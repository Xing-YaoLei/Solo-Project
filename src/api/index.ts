import apiClient from './client';
import type {
  LoginRequest,
  LoginResponse,
  ExportTriggerRequest,
  ExportStatusResponse,
  ExceptionCreateRequest,
  ExceptionUpdateRequest,
  CaliberNote,
  PaginatedResponse,
} from './types';
import type { Prescription, ExceptionRecord } from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
};

export const prescriptionApi = {
  list: (params?: {
    status?: string;
    store_id?: string;
    prescription_type?: string;
    page?: number;
    page_size?: number;
    search?: string;
  }) =>
    apiClient.get<PaginatedResponse<Prescription>>('/prescriptions', { params }),
  get: (id: string) =>
    apiClient.get<Prescription>(`/prescriptions/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch<Prescription>(`/prescriptions/${id}`, { status }),
  markException: (id: string, data: ExceptionCreateRequest) =>
    apiClient.post<Prescription>(`/prescriptions/${id}/mark-exception`, data),
  batchUpdateStatus: (prescription_ids: string[], status: string) =>
    apiClient.post<Prescription[]>('/prescriptions/batch-status', { prescription_ids, status }),
};

export const exceptionApi = {
  list: (params?: {
    status?: string;
    assignee_id?: string;
    page?: number;
    page_size?: number;
  }) =>
    apiClient.get<PaginatedResponse<ExceptionRecord>>('/exceptions', { params }),
  get: (id: string) =>
    apiClient.get<ExceptionRecord>(`/exceptions/${id}`),
  create: (data: ExceptionCreateRequest) =>
    apiClient.post<ExceptionRecord>('/exceptions', data),
  update: (id: string, data: ExceptionUpdateRequest) =>
    apiClient.patch<ExceptionRecord>(`/exceptions/${id}`, data),
};

export const exportApi = {
  trigger: (data: ExportTriggerRequest) =>
    apiClient.post<ExportStatusResponse>('/export/trigger', data),
  getStatus: (taskId: string) =>
    apiClient.get<ExportStatusResponse>(`/export/status/${taskId}`),
  download: (taskId: string) =>
    `${apiClient.defaults.baseURL}/export/download/${taskId}`,
};

export const caliberApi = {
  list: () => apiClient.get<CaliberNote[]>('/caliber-notes'),
};
