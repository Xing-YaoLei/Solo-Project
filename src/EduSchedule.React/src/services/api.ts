import axios from 'axios';
import type {
  User, LoginRequest, LoginResult, Course, Classroom, Student, CourseSchedule,
  Conflict, Semester, TimeSlot, TodoItem, ApprovalStatistics, ApprovalTrend,
  DashboardOverview, ConflictSummary
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
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

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResult>('/auth/login', data),
  register: (data: any) => api.post<User>('/auth/register', data),
  getCurrentUser: () => api.get<User>('/auth/me'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

export const courseApi = {
  getAll: (params?: { semesterId?: number; departmentId?: number; status?: string; search?: string }) =>
    api.get<Course[]>('/courses', { params }),
  getById: (id: number) => api.get<Course>(`/courses/${id}`),
  create: (data: Partial<Course>) => api.post<Course>('/courses', data),
  update: (id: number, data: Partial<Course>) => api.put<Course>(`/courses/${id}`, data),
  delete: (id: number) => api.delete(`/courses/${id}`),
  assignTeacher: (courseId: number, teacherId: number, isMainTeacher = true) =>
    api.post(`/courses/${courseId}/teachers/${teacherId}`, null, { params: { isMainTeacher } }),
  removeTeacher: (courseId: number, teacherId: number) =>
    api.delete(`/courses/${courseId}/teachers/${teacherId}`),
};

export const classroomApi = {
  getAll: (params?: { type?: string; minCapacity?: number; search?: string }) =>
    api.get<Classroom[]>('/classrooms', { params }),
  getById: (id: number) => api.get<Classroom>(`/classrooms/${id}`),
  create: (data: Partial<Classroom>) => api.post<Classroom>('/classrooms', data),
  update: (id: number, data: Partial<Classroom>) => api.put<Classroom>(`/classrooms/${id}`, data),
  delete: (id: number) => api.delete(`/classrooms/${id}`),
  getAvailable: (params: {
    semesterId: number;
    dayOfWeek: number;
    timeSlotId: number;
    startWeek: number;
    endWeek: number;
    requiredType?: string;
    minCapacity?: number;
  }) => api.get<Classroom[]>('/classrooms/available', { params }),
  getUsageReport: (semesterId: number) =>
    api.get(`/classrooms/usage-report/${semesterId}`),
};

export const studentApi = {
  getAll: (params?: { departmentId?: number; grade?: number; major?: string; search?: string }) =>
    api.get<Student[]>('/students', { params }),
  getById: (id: number) => api.get<Student>(`/students/${id}`),
  getByNumber: (studentNumber: string) => api.get<Student>(`/students/by-number/${studentNumber}`),
  create: (data: Partial<Student>) => api.post<Student>('/students', data),
  update: (id: number, data: Partial<Student>) => api.put<Student>(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
  getEnrollments: (studentId: number, semesterId?: number) =>
    api.get(`/students/${studentId}/enrollments`, { params: { semesterId } }),
  getTranscripts: (studentId: number, semesterId?: number) =>
    api.get(`/students/${studentId}/transcripts`, { params: { semesterId } }),
};

export const scheduleApi = {
  getAll: (params?: { semesterId?: number; courseId?: number; classroomId?: number }) =>
    api.get<CourseSchedule[]>('/schedules', { params }),
  getById: (id: number) => api.get<CourseSchedule>(`/schedules/${id}`),
  create: (data: Partial<CourseSchedule>) => api.post<CourseSchedule>('/schedules', data),
  update: (id: number, data: Partial<CourseSchedule>) => api.put<CourseSchedule>(`/schedules/${id}`, data),
  delete: (id: number) => api.delete(`/schedules/${id}`),
  submitForApproval: (id: number) => api.post(`/schedules/${id}/submit`),
  approve: (id: number, comments?: string) => api.post(`/schedules/${id}/approve`, { comments }),
  reject: (id: number, comments: string) => api.post(`/schedules/${id}/reject`, { comments }),
  getWeekly: (params: {
    semesterId: number;
    classroomId?: number;
    courseId?: number;
    teacherId?: number;
  }) => api.get<CourseSchedule[]>('/schedules/weekly', { params }),
  detectConflicts: (semesterId: number) => api.post<Conflict[]>(`/schedules/detect-conflicts/${semesterId}`),
  checkConflict: (data: Partial<CourseSchedule>) => api.post<boolean>('/schedules/check-conflict', data),
};

export const conflictApi = {
  getAll: (params?: { status?: string; level?: string; semesterId?: number }) =>
    api.get<Conflict[]>('/conflicts', { params }),
  getById: (id: number) => api.get<Conflict>(`/conflicts/${id}`),
  assign: (conflictId: number, userId: number) =>
    api.post(`/conflicts/${conflictId}/assign`, { userId }),
  resolve: (conflictId: number, resolution: string) =>
    api.post(`/conflicts/${conflictId}/resolve`, { resolution }),
  addCommunication: (conflictId: number, message: string, type = 'Comment') =>
    api.post(`/conflicts/${conflictId}/communications`, { message, type }),
  addReview: (conflictId: number, data: { opinion: string; result: string; suggestions?: string }) =>
    api.post(`/conflicts/${conflictId}/reviews`, data),
  detectAll: (semesterId: number) => api.post<Conflict[]>(`/conflicts/detect-all/${semesterId}`),
};

export const approvalApi = {
  getPending: (params?: { approverId?: number; level?: number }) =>
    api.get('/approvals/pending', { params }),
  getByScheduleId: (scheduleId: number) =>
    api.get(`/approvals/schedule/${scheduleId}`),
  getStatistics: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ApprovalStatistics>('/approvals/statistics', { params }),
  getTrend: (days = 30) => api.get<ApprovalTrend[]>('/approvals/trend', { params: { days } }),
  getMyTodos: () => api.get<TodoItem[]>('/approvals/todos'),
};

export const dashboardApi = {
  getOverview: () => api.get<DashboardOverview>('/dashboard/overview'),
  getApprovalTrend: (days = 30) => api.get<ApprovalTrend[]>('/dashboard/approval-trend', { params: { days } }),
  getConflictSummary: () => api.get<ConflictSummary>('/dashboard/conflict-summary'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

export const semesterApi = {
  getAll: () => api.get<Semester[]>('/semesters'),
  getById: (id: number) => api.get<Semester>(`/semesters/${id}`),
  getCurrent: () => api.get<Semester>('/semesters/current'),
  create: (data: Partial<Semester>) => api.post<Semester>('/semesters', data),
  update: (id: number, data: Partial<Semester>) => api.put(`/semesters/${id}`, data),
  delete: (id: number) => api.delete(`/semesters/${id}`),
};

export const timeSlotApi = {
  getAll: () => api.get<TimeSlot[]>('/timeSlots'),
  getById: (id: number) => api.get<TimeSlot>(`/timeSlots/${id}`),
  create: (data: Partial<TimeSlot>) => api.post<TimeSlot>('/timeSlots', data),
  update: (id: number, data: Partial<TimeSlot>) => api.put(`/timeSlots/${id}`, data),
  delete: (id: number) => api.delete(`/timeSlots/${id}`),
};

export default api;
