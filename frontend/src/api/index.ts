import api from './instance';
import type {
  User, Course, CourseListItem, Chapter, Assignment, Tag,
  ProgressRecord, Notification, MonthlyReviewResponse,
  CourseMonthlyStats, ExportLogResponse, CurrentProgress
} from '@/types';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post<any, { access_token: string; token_type: string; user: User }>('/auth/login', data),
  register: (data: any) => api.post<any, User>('/auth/register', data),
  getMe: () => api.get<any, User>('/auth/me'),
};

export const userApi = {
  list: (params?: { role?: string; search?: string }) =>
    api.get<any, User[]>('/users', { params }),
  trainers: () => api.get<any, User[]>('/users/trainers'),
  members: () => api.get<any, User[]>('/users/members'),
  get: (id: number) => api.get<any, User>(`/users/${id}`),
  update: (id: number, data: any) => api.put<any, User>(`/users/${id}`, data),
};

export const courseApi = {
  list: (params?: { status?: string; trainer_id?: number; member_id?: number; search?: string }) =>
    api.get<any, CourseListItem[]>('/courses', { params }),
  get: (id: number) => api.get<any, Course>(`/courses/${id}`),
  create: (data: any) => api.post<any, Course>('/courses', data),
  update: (id: number, data: any) => api.put<any, Course>(`/courses/${id}`, data),
  addMembers: (courseId: number, memberIds: number[]) =>
    api.post<any, any[]>(`/courses/${courseId}/members`, memberIds),
  removeMember: (courseId: number, memberId: number) =>
    api.delete<any, any>(`/courses/${courseId}/members/${memberId}`),
  createChapter: (courseId: number, data: any) =>
    api.post<any, Chapter>(`/courses/${courseId}/chapters`, data),
  updateChapter: (chapterId: number, data: any) =>
    api.put<any, Chapter>(`/courses/chapters/${chapterId}`, data),
  createAssignment: (chapterId: number, data: any) =>
    api.post<any, Assignment>(`/courses/chapters/${chapterId}/assignments`, data),
  updateAssignment: (assignmentId: number, data: any) =>
    api.put<any, Assignment>(`/courses/assignments/${assignmentId}`, data),
  tags: () => api.get<any, Tag[]>('/courses/tags/all'),
  createTag: (data: any) => api.post<any, Tag>('/courses/tags', data),
};

export const progressApi = {
  list: (params?: { course_id?: number; member_id?: number }) =>
    api.get<any, ProgressRecord[]>('/progress', { params }),
  history: (courseId: number, memberId: number) =>
    api.get<any, ProgressRecord[]>(`/progress/history/${courseId}/${memberId}`),
  create: (data: any) => api.post<any, ProgressRecord>('/progress', data),
  current: (courseId: number, memberId: number) =>
    api.get<any, CurrentProgress>(`/progress/current/${courseId}/${memberId}`),
};

export const reviewApi = {
  monthly: (data: { year: number; month: number; trainer_id?: number; member_id?: number; course_id?: number }) =>
    api.post<any, MonthlyReviewResponse>('/review/monthly', data),
  exportMonthly: (data: { year: number; month: number; trainer_id?: number; member_id?: number; course_id?: number }) =>
    api.post<any, Blob>('/review/export/monthly', data, { responseType: 'blob' }),
  exportLogs: () => api.get<any, ExportLogResponse[]>('/review/export-logs'),
};

export const notificationApi = {
  list: (params?: { status?: string; course_id?: number; member_id?: number; to_user_id?: number }) =>
    api.get<any, Notification[]>('/notifications', { params }),
  get: (id: number) => api.get<any, Notification>(`/notifications/${id}`),
  create: (data: any) => api.post<any, Notification>('/notifications', data),
  update: (id: number, data: any) => api.put<any, Notification>(`/notifications/${id}`, data),
  handle: (id: number, data: { delay_reason: string; action_taken: string; close_notification?: boolean }) =>
    api.post<any, Notification>(`/notifications/${id}/handle`, null, {
      params: data,
    }),
  close: (id: number) => api.post<any, Notification>(`/notifications/${id}/close`),
};
