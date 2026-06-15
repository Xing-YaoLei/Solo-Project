import axios from 'axios';
import type {
  FunnelOverview,
  ChapterFunnel,
  RegionFunnel,
  TrendItem,
  DelayedDistribution,
  AlertThreshold,
  AlertResult,
  NoteTask,
  GradeOverview,
  HomeworkStats,
  ChapterGrade,
  ReviewMaterial,
  ReminderRule,
} from '../types';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const funnelApi = {
  getOverview: (params?: {
    course_id?: number;
    region_id?: number;
    date_from?: string;
    date_to?: string;
  }) => request.get<FunnelOverview>('/funnel/overview', { params }),

  getChapters: (courseId: number, params?: { region_id?: number }) =>
    request.get<ChapterFunnel[]>(`/funnel/chapters/${courseId}`, { params }),

  getByRegion: (params?: { course_id?: number; level?: string }) =>
    request.get<RegionFunnel[]>('/funnel/regions', { params }),

  getTrend: (params?: { course_id?: number; region_id?: number; days?: number }) =>
    request.get<TrendItem[]>('/funnel/trend', { params }),

  getDelayed: (params?: { course_id?: number; region_id?: number }) =>
    request.get<DelayedDistribution[]>('/funnel/delayed', { params }),
};

export const alertApi = {
  getThresholds: (params?: { type?: string; is_active?: boolean }) =>
    request.get<AlertThreshold[]>('/alerts/thresholds', { params }),

  createThreshold: (data: any) =>
    request.post<AlertThreshold>('/alerts/thresholds', data),

  updateThreshold: (id: number, data: any) =>
    request.put(`/alerts/thresholds/${id}`, data),

  deleteThreshold: (id: number) =>
    request.delete(`/alerts/thresholds/${id}`),

  checkAlerts: (params?: { course_id?: number; region_id?: number }) =>
    request.get<AlertResult[]>('/alerts/check', { params }),

  getNoteTasks: (params?: { status?: string; student_id?: number }) =>
    request.get<NoteTask[]>('/alerts/note-tasks', { params }),

  resolveNoteTask: (id: number, conclusion: string) =>
    request.post(`/alerts/note-tasks/${id}/resolve`, { conclusion }),
};

export const reviewApi = {
  getList: (params?: { type?: string; status?: string; course_id?: number }) =>
    request.get<ReviewMaterial[]>('/reviews', { params }),

  generate: (params?: { type?: string; course_id?: number; region_id?: number; created_by?: string }) =>
    request.post<ReviewMaterial>('/reviews/generate', null, { params }),

  getDetail: (id: number) =>
    request.get<ReviewMaterial>(`/reviews/${id}`),

  updateStatus: (id: number, status: string) =>
    request.put(`/reviews/${id}/status`, null, { params: { status } }),
};

export const gradeApi = {
  getOverview: (params?: { course_id?: number; region_id?: number }) =>
    request.get<GradeOverview>('/grades/overview', { params }),

  getHomeworkStats: (params?: { course_id?: number; region_id?: number }) =>
    request.get<HomeworkStats>('/grades/homework', { params }),

  getChapterGrades: (courseId: number, params?: { region_id?: number }) =>
    request.get<ChapterGrade[]>(`/grades/chapters/${courseId}`, { params }),

  getTrend: (params?: { course_id?: number; region_id?: number; days?: number }) =>
    request.get<TrendItem[]>('/grades/trend', { params }),
};

export const reminderApi = {
  getRules: (params?: { type?: string; is_active?: boolean }) =>
    request.get<ReminderRule[]>('/reminders/rules', { params }),

  createRule: (data: any) =>
    request.post<ReminderRule>('/reminders/rules', data),

  updateRule: (id: number, data: any) =>
    request.put(`/reminders/rules/${id}`, data),

  deleteRule: (id: number) =>
    request.delete(`/reminders/rules/${id}`),
};

export default request;
