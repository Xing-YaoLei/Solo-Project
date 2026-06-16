import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const analyticsApi = {
  getImageArchiveTrend: (params?: Record<string, string>) => api.get('/analytics/image-archive-trend', { params }),
  getImageTypeDistribution: (params?: Record<string, string>) => api.get('/analytics/image-type-distribution', { params }),
  getPatientArchiveStats: (params?: Record<string, string>) => api.get('/analytics/patient-archive-stats', { params }),
  getMedicalRecordStats: (params?: Record<string, string>) => api.get('/analytics/medical-record-stats', { params }),
  getTreatmentPlanStats: (params?: Record<string, string>) => api.get('/analytics/treatment-plan-stats', { params }),
  getDepartmentArchiveTrend: (params?: Record<string, string>) => api.get('/analytics/department-archive-trend', { params }),
  getNoShowFollowUpAnalysis: () => api.get('/analytics/no-show-follow-up-analysis'),
  getDailyArchiveVolume: (days?: number) => api.get('/analytics/daily-archive-volume', { params: { days } }),
  refreshAnalytics: () => api.post('/analytics/refresh'),
};

export const warningApi = {
  getThresholds: (params?: Record<string, string>) => api.get('/warnings/thresholds', { params }),
  createThreshold: (data: Record<string, unknown>) => api.post('/warnings/thresholds', data),
  updateThreshold: (id: number, data: Record<string, unknown>) => api.put(`/warnings/thresholds/${id}`, data),
  deleteThreshold: (id: number) => api.delete(`/warnings/thresholds/${id}`),
  getAlerts: () => api.get('/warnings/alerts'),
  getNoShowAnalysis: () => api.get('/warnings/no-show-analysis'),
  createNoShowReview: (patientId: string, appointmentId?: string) => api.post(`/warnings/no-show-review/${patientId}`, null, { params: { appointment_id: appointmentId } }),
  getNoShowReviews: (status?: string) => api.get('/warnings/no-show-reviews', { params: { status } }),
  updateNoShowReview: (reviewId: number, status: string, reviewer?: string, notes?: string) => api.put(`/warnings/no-show-reviews/${reviewId}`, null, { params: { status, reviewer, notes } }),
  getNoShowReviewMaterials: (patientId: string) => api.get(`/warnings/no-show-review-materials/${patientId}`),
};

export const conflictApi = {
  getConflicts: (params?: Record<string, string>) => api.get('/conflicts/', { params }),
  getConflictStats: () => api.get('/conflicts/stats'),
  getConflict: (id: number) => api.get(`/conflicts/${id}`),
  resolveConflict: (id: number, data: { resolution_status: string; resolved_by?: string; resolution_notes?: string; keep_both?: boolean }) => api.put(`/conflicts/${id}/resolve`, null, { params: data }),
};

export const dataApi = {
  uploadData: (dataType: string, file: File, sourceSystem?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (sourceSystem) formData.append('source_system', sourceSystem);
    return api.post(`/data/upload/${dataType}`, formData);
  },
};

export default api;
