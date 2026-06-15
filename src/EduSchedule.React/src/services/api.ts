import axios from 'axios';
import type {
  User, LoginRequest, LoginResult, Course, Classroom, Student, CourseSchedule,
  Conflict, Semester, TimeSlot, TodoItem, ApprovalStatistics, ApprovalTrend,
  DashboardOverview, ConflictSummary, Transcript, Application,
  PaginatedResponse, TranscriptStats, ApplicationStats, ConflictCommunication, ConflictReview
} from '../types';

const http = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: (username: string, password: string) =>
      http.post<LoginResult>('/auth/login', { username, password }),
    register: (data: any) => http.post<User>('/auth/register', data),
    getCurrentUser: () => http.get<User>('/auth/me'),
    changePassword: (data: { oldPassword: string; newPassword: string }) =>
      http.post('/auth/change-password', data),
  },

  courses: {
    getList: (params?: { page?: number; pageSize?: number; semesterId?: number; departmentId?: number; status?: string; search?: string }) =>
      http.get<PaginatedResponse<Course>>('/courses', { params }),
    getById: (id: number) => http.get<Course>(`/courses/${id}`),
    create: (data: Partial<Course>) => http.post<Course>('/courses', data),
    update: (id: number, data: Partial<Course>) => http.put<Course>(`/courses/${id}`, data),
    delete: (id: number) => http.delete(`/courses/${id}`),
    assignTeacher: (courseId: number, teacherId: number, isMainTeacher = true) =>
      http.post(`/courses/${courseId}/teachers/${teacherId}`, null, { params: { isMainTeacher } }),
    removeTeacher: (courseId: number, teacherId: number) =>
      http.delete(`/courses/${courseId}/teachers/${teacherId}`),
  },

  classrooms: {
    getList: (params?: { page?: number; pageSize?: number; type?: string; minCapacity?: number; search?: string }) =>
      http.get<PaginatedResponse<Classroom>>('/classrooms', { params }),
    getById: (id: number) => http.get<Classroom>(`/classrooms/${id}`),
    create: (data: Partial<Classroom>) => http.post<Classroom>('/classrooms', data),
    update: (id: number, data: Partial<Classroom>) => http.put<Classroom>(`/classrooms/${id}`, data),
    delete: (id: number) => http.delete(`/classrooms/${id}`),
    getAvailable: (params: {
      semesterId: number;
      dayOfWeek: number;
      timeSlotId: number;
      startWeek: number;
      endWeek: number;
      requiredType?: string;
      minCapacity?: number;
    }) => http.get<Classroom[]>('/classrooms/available', { params }),
    getUsageReport: (semesterId: number) =>
      http.get(`/classrooms/usage-report/${semesterId}`),
  },

  students: {
    getList: (params?: { page?: number; pageSize?: number; departmentId?: number; grade?: number; major?: string; search?: string }) =>
      http.get<PaginatedResponse<Student>>('/students', { params }),
    getById: (id: number) => http.get<Student>(`/students/${id}`),
    getByNumber: (studentNumber: string) => http.get<Student>(`/students/by-number/${studentNumber}`),
    create: (data: Partial<Student>) => http.post<Student>('/students', data),
    update: (id: number, data: Partial<Student>) => http.put<Student>(`/students/${id}`, data),
    delete: (id: number) => http.delete(`/students/${id}`),
    getEnrollments: (studentId: number, semesterId?: number) =>
      http.get(`/students/${studentId}/enrollments`, { params: { semesterId } }),
    getTranscripts: (studentId: number, semesterId?: number) =>
      http.get(`/students/${studentId}/transcripts`, { params: { semesterId } }),
  },

  schedules: {
    getList: (params?: { page?: number; pageSize?: number; semesterId?: number; courseId?: number; classroomId?: number; search?: string }) =>
      http.get<PaginatedResponse<CourseSchedule>>('/schedules', { params }),
    getById: (id: number) => http.get<CourseSchedule>(`/schedules/${id}`),
    create: (data: Partial<CourseSchedule>) => http.post<CourseSchedule>('/schedules', data),
    update: (id: number, data: Partial<CourseSchedule>) => http.put<CourseSchedule>(`/schedules/${id}`, data),
    delete: (id: number) => http.delete(`/schedules/${id}`),
    submitForApproval: (id: number) => http.post(`/schedules/${id}/submit`),
    approve: (id: number, comments?: string) => http.post(`/schedules/${id}/approve`, { comments }),
    reject: (id: number, comments: string) => http.post(`/schedules/${id}/reject`, { comments }),
    getWeekly: (params: {
      semesterId: number;
      classroomId?: number;
      courseId?: number;
      teacherId?: number;
    }) => http.get<CourseSchedule[]>('/schedules/weekly', { params }),
    detectConflicts: (semesterId: number) => http.post<Conflict[]>(`/schedules/detect-conflicts/${semesterId}`),
    checkConflict: (data: Partial<CourseSchedule>) => http.post<boolean>('/schedules/check-conflict', data),
  },

  conflicts: {
    getList: (params?: { page?: number; pageSize?: number; status?: string; level?: string; semesterId?: number }) =>
      http.get<PaginatedResponse<Conflict>>('/conflicts', { params }),
    getById: (id: number) => http.get<Conflict>(`/conflicts/${id}`),
    getCommunications: (conflictId: number) =>
      http.get<ConflictCommunication[]>(`/conflicts/${conflictId}/communications`),
    getReviews: (conflictId: number) =>
      http.get<ConflictReview[]>(`/conflicts/${conflictId}/reviews`),
    assign: (conflictId: number, userId: number) =>
      http.post(`/conflicts/${conflictId}/assign`, { userId }),
    resolve: (conflictId: number, data: { resolution: string; resolutionType?: string; newSchedule1Id?: number; newSchedule2Id?: number }) =>
      http.post(`/conflicts/${conflictId}/resolve`, data),
    escalate: (conflictId: number, data: { reason: string; escalateTo: number }) =>
      http.post(`/conflicts/${conflictId}/escalate`, data),
    addCommunication: (conflictId: number, data: { message: string; isInternal?: boolean; attachmentUrl?: string }) =>
      http.post(`/conflicts/${conflictId}/communications`, data),
    addReview: (conflictId: number, data: { reviewComment: string; reviewResult: string; suggestions?: string }) =>
      http.post(`/conflicts/${conflictId}/reviews`, data),
    detectAll: (semesterId: number) => http.post<Conflict[]>(`/conflicts/detect-all/${semesterId}`),
  },

  approvals: {
    getPending: (params?: { approverId?: number; level?: number }) =>
      http.get('/approvals/pending', { params }),
    getByScheduleId: (scheduleId: number) =>
      http.get(`/approvals/schedule/${scheduleId}`),
    getStatistics: (params?: { startDate?: string; endDate?: string }) =>
      http.get<ApprovalStatistics>('/approvals/statistics', { params }),
    getTrend: (days = 30) => http.get<ApprovalTrend[]>('/approvals/trend', { params: { days } }),
    getMyTodos: () => http.get<TodoItem[]>('/approvals/todos'),
  },

  dashboard: {
    getOverview: () => http.get<DashboardOverview>('/dashboard/overview'),
    getApprovalTrend: (days = 30) => http.get<ApprovalTrend[]>('/dashboard/approval-trend', { params: { days } }),
    getConflictSummary: () => http.get<ConflictSummary>('/dashboard/conflict-summary'),
    getRecentActivity: () => http.get('/dashboard/recent-activity'),
  },

  semesters: {
    getList: () => http.get<Semester[]>('/semesters'),
    getById: (id: number) => http.get<Semester>(`/semesters/${id}`),
    getCurrent: () => http.get<Semester>('/semesters/current'),
    create: (data: Partial<Semester>) => http.post<Semester>('/semesters', data),
    update: (id: number, data: Partial<Semester>) => http.put(`/semesters/${id}`, data),
    delete: (id: number) => http.delete(`/semesters/${id}`),
  },

  timeSlots: {
    getList: () => http.get<TimeSlot[]>('/timeSlots'),
    getById: (id: number) => http.get<TimeSlot>(`/timeSlots/${id}`),
    create: (data: Partial<TimeSlot>) => http.post<TimeSlot>('/timeSlots', data),
    update: (id: number, data: Partial<TimeSlot>) => http.put(`/timeSlots/${id}`, data),
    delete: (id: number) => http.delete(`/timeSlots/${id}`),
  },

  transcripts: {
    getList: (params?: { page?: number; pageSize?: number; studentId?: number; courseId?: number; semester?: string; search?: string }) =>
      http.get<PaginatedResponse<Transcript>>('/transcripts', { params }),
    getById: (id: number) => http.get<Transcript>(`/transcripts/${id}`),
    getStats: () => http.get<TranscriptStats>('/transcripts/stats'),
    create: (data: Partial<Transcript>) => http.post<Transcript>('/transcripts', data),
    update: (id: number, data: Partial<Transcript>) => http.put<Transcript>(`/transcripts/${id}`, data),
    delete: (id: number) => http.delete(`/transcripts/${id}`),
    getByStudent: (studentId: number, semesterId?: number) =>
      http.get<Transcript[]>(`/transcripts/student/${studentId}`, { params: { semesterId } }),
    export: (params?: { studentId?: number; semester?: string }) =>
      http.get('/transcripts/export', { params, responseType: 'blob' }),
  },

  applications: {
    getList: (params?: { page?: number; pageSize?: number; applicantId?: number; applicationType?: string; status?: string; search?: string }) =>
      http.get<PaginatedResponse<Application>>('/applications', { params }),
    getById: (id: number) => http.get<Application>(`/applications/${id}`),
    getStats: () => http.get<ApplicationStats>('/applications/stats'),
    create: (data: Partial<Application>) => http.post<Application>('/applications', data),
    update: (id: number, data: Partial<Application>) => http.put<Application>(`/applications/${id}`, data),
    delete: (id: number) => http.delete(`/applications/${id}`),
    submitForApproval: (id: number) => http.post(`/applications/${id}/submit`),
    approve: (id: number, data: { comment?: string }) => http.post(`/applications/${id}/approve`, data),
    reject: (id: number, data: { comment: string }) => http.post(`/applications/${id}/reject`, data),
  },
};

export default http;
