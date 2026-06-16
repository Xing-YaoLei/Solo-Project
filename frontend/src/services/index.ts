import api from './api';
import type {
  PatientSummary,
  Patient,
  AppointmentList,
  AppointmentDetail,
  TreatmentPlan,
  FollowUpTask,
  BillingRecord,
  ImageAttachment,
  NoShowAppointment,
  DashboardStats,
  AppointmentRate,
  ReAppointmentTrend,
  AppointmentStatus,
  RiskLevel,
  TreatmentStatus,
  FollowUpStatus,
  FollowUpType,
  BillingStatus,
} from '../types';

export const patientApi = {
  getPatients: (search?: string, page = 1, pageSize = 20) =>
    api.get<PatientSummary[]>('/patients', {
      params: { search, page, pageSize },
    }),

  getPatient: (id: number) => api.get<Patient>(`/patients/${id}`),

  getPatientSummary: (id: number) =>
    api.get<PatientSummary>(`/patients/${id}/summary`),

  createPatient: (data: Partial<Patient>) =>
    api.post<Patient>('/patients', data),

  updatePatient: (id: number, data: Partial<Patient>) =>
    api.put<Patient>(`/patients/${id}`, data),

  deletePatient: (id: number) => api.delete(`/patients/${id}`),
};

export const appointmentApi = {
  getAppointments: (params?: {
    startDate?: string;
    endDate?: string;
    status?: AppointmentStatus;
    patientId?: number;
    riskLevel?: RiskLevel;
    page?: number;
    pageSize?: number;
  }) => api.get<AppointmentList[]>('/appointments', { params }),

  getAppointment: (id: number) =>
    api.get<AppointmentDetail>(`/appointments/${id}`),

  createAppointment: (data: any) =>
    api.post<AppointmentDetail>('/appointments', data),

  updateAppointment: (id: number, data: any) =>
    api.put<AppointmentDetail>(`/appointments/${id}`, data),

  deleteAppointment: (id: number) => api.delete(`/appointments/${id}`),

  updateStatus: (id: number, status: AppointmentStatus) =>
    api.put(`/appointments/${id}/status`, null, { params: { status } }),

  getNoShowAppointments: (minRiskLevel?: RiskLevel) =>
    api.get<NoShowAppointment[]>('/appointments/no-show', {
      params: { minRiskLevel },
    }),

  updateCommunicationNotes: (id: number, notes: string) =>
    api.put(`/appointments/${id}/communication-notes`, notes, {
      headers: { 'Content-Type': 'application/json' },
    }),

  updateReviewComments: (id: number, comments: string) =>
    api.put(`/appointments/${id}/review-comments`, comments, {
      headers: { 'Content-Type': 'application/json' },
    }),
};

export const treatmentPlanApi = {
  getTreatmentPlans: (params?: {
    patientId?: number;
    status?: TreatmentStatus;
    page?: number;
    pageSize?: number;
  }) => api.get<TreatmentPlan[]>('/treatmentplans', { params }),

  getTreatmentPlan: (id: number) =>
    api.get<TreatmentPlan>(`/treatmentplans/${id}`),

  createTreatmentPlan: (data: any) =>
    api.post<TreatmentPlan>('/treatmentplans', data),

  updateTreatmentPlan: (id: number, data: any) =>
    api.put<TreatmentPlan>(`/treatmentplans/${id}`, data),

  deleteTreatmentPlan: (id: number) =>
    api.delete(`/treatmentplans/${id}`),

  updatePlanItemStatus: (itemId: number, isCompleted: boolean) =>
    api.put(`/treatmentplans/items/${itemId}/status`, null, {
      params: { isCompleted },
    }),
};

export const followUpApi = {
  getFollowUpTasks: (params?: {
    status?: FollowUpStatus;
    type?: FollowUpType;
    patientId?: number;
    appointmentId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<FollowUpTask[]>('/followups', { params }),

  getFollowUpTask: (id: number) =>
    api.get<FollowUpTask>(`/followups/${id}`),

  createFollowUpTask: (data: any) =>
    api.post<FollowUpTask>('/followups', data),

  updateFollowUpTask: (id: number, data: any) =>
    api.put<FollowUpTask>(`/followups/${id}`, data),

  deleteFollowUpTask: (id: number) => api.delete(`/followups/${id}`),

  completeTask: (id: number, result: string, completedBy: string) =>
    api.put(`/followups/${id}/complete`, null, {
      params: { result, completedBy },
    }),
};

export const billingApi = {
  getBillingRecords: (params?: {
    patientId?: number;
    status?: BillingStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<BillingRecord[]>('/billing', { params }),

  getBillingRecord: (id: number) =>
    api.get<BillingRecord>(`/billing/${id}`),

  createBillingRecord: (data: any) =>
    api.post<BillingRecord>('/billing', data),

  updateBillingRecord: (id: number, data: any) =>
    api.put<BillingRecord>(`/billing/${id}`, data),

  deleteBillingRecord: (id: number) => api.delete(`/billing/${id}`),

  getTotalRevenue: (startDate?: string, endDate?: string) =>
    api.get<number>('/billing/revenue', { params: { startDate, endDate } }),
};

export const imageApi = {
  getImages: (params?: {
    patientId?: number;
    appointmentId?: number;
    treatmentPlanId?: number;
    category?: string;
    page?: number;
    pageSize?: number;
  }) => api.get<ImageAttachment[]>('/images', { params }),

  getImage: (id: number) => api.get<ImageAttachment>(`/images/${id}`),

  uploadImage: (formData: FormData) =>
    api.post<ImageAttachment>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteImage: (id: number) => api.delete(`/images/${id}`),
};

export const reportApi = {
  getDashboardStats: () => api.get<DashboardStats>('/reports/dashboard'),

  getAppointmentRates: (startDate: string, endDate: string) =>
    api.get<AppointmentRate[]>('/reports/appointment-rates', {
      params: { startDate, endDate },
    }),

  getReAppointmentTrend: (months = 6) =>
    api.get<ReAppointmentTrend[]>('/reports/reappointment-trend', {
      params: { months },
    }),

  getHighRiskNoShows: (topN = 10) =>
    api.get<NoShowAppointment[]>('/reports/high-risk-noshows', {
      params: { topN },
    }),
};
