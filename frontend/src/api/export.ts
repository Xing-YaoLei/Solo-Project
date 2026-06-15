import api from './axios';
import type { MonthlyReview, CourseReview, ExportRecord, PagedResult, ExportType } from '../types';

export const reviewApi = {
  getMonthlyReview: (params: {
    year: number;
    month: number;
    certificateId?: number;
    courseId?: number;
  }) =>
    api.get<MonthlyReview>('/monthlyReview', { params }).then((r) => r.data),

  getCourseReviews: (params: {
    year: number;
    month: number;
    certificateId: number;
  }) =>
    api.get<CourseReview[]>('/monthlyReview/courses', { params }).then((r) => r.data),
};

export const exportApi = {
  exportLearningProgress: (data: {
    startDate?: string;
    endDate?: string;
    certificateId?: number;
    courseId?: number;
    userId?: number;
    generatedByUserId: number;
    additionalFilters?: string;
  }) =>
    api.post<ExportRecord>('/exports/learning-progress', data).then((r) => r.data),

  exportMonthlyReview: (data: {
    startDate?: string;
    endDate?: string;
    certificateId?: number;
    courseId?: number;
    userId?: number;
    generatedByUserId: number;
    additionalFilters?: string;
  }) =>
    api.post<ExportRecord>('/exports/monthly-review', data).then((r) => r.data),

  exportAssignments: (data: {
    startDate?: string;
    endDate?: string;
    certificateId?: number;
    courseId?: number;
    userId?: number;
    generatedByUserId: number;
    additionalFilters?: string;
  }) =>
    api.post<ExportRecord>('/exports/assignments', data).then((r) => r.data),

  exportAlerts: (data: {
    startDate?: string;
    endDate?: string;
    certificateId?: number;
    courseId?: number;
    userId?: number;
    generatedByUserId: number;
    additionalFilters?: string;
  }) =>
    api.post<ExportRecord>('/exports/alerts', data).then((r) => r.data),

  download: (id: number) =>
    api.get(`/exports/${id}/download`, { responseType: 'blob' }).then((r) => r.data),

  getHistory: (params: {
    pageIndex?: number;
    pageSize?: number;
    type?: ExportType;
  }) =>
    api.get<PagedResult<ExportRecord>>('/exports/history', { params }).then((r) => r.data),
};
