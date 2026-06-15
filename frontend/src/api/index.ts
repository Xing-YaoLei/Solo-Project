import api from './client';
import type {
  User, AuthResponse, Tag, Course, Chapter, Question,
  StudyProgress, PracticeRecord, ReminderRule, ReminderRecord,
  Communication, ReviewConclusion, TodoItem, CompletionTrendItem
} from '@/types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(r => r.data),

  register: (data: { username: string; password: string; email?: string; full_name?: string; role?: string }) =>
    api.post<User>('/auth/register', data).then(r => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then(r => r.data),
};

export const tagsApi = {
  list: (category?: string) =>
    api.get<Tag[]>('/tags', { params: { category } }).then(r => r.data),

  create: (data: Partial<Tag>) =>
    api.post<Tag>('/tags', data).then(r => r.data),

  update: (id: number, data: Partial<Tag>) =>
    api.put<Tag>(`/tags/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/tags/${id}`).then(r => r.data),
};

export const coursesApi = {
  list: (search?: string) =>
    api.get<Course[]>('/courses', { params: { search } }).then(r => r.data),

  get: (id: number) =>
    api.get<Course>(`/courses/${id}`).then(r => r.data),

  create: (data: Partial<Course>) =>
    api.post<Course>('/courses', data).then(r => r.data),

  update: (id: number, data: Partial<Course>) =>
    api.put<Course>(`/courses/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/courses/${id}`).then(r => r.data),

  createChapter: (courseId: number, data: Partial<Chapter>) =>
    api.post<Chapter>(`/courses/${courseId}/chapters`, data).then(r => r.data),

  updateChapter: (chapterId: number, data: Partial<Chapter>) =>
    api.put<Chapter>(`/courses/chapters/${chapterId}`, data).then(r => r.data),

  deleteChapter: (chapterId: number) =>
    api.delete(`/courses/chapters/${chapterId}`).then(r => r.data),
};

export const questionsApi = {
  list: (params?: {
    course_id?: number;
    chapter_id?: number;
    tag_id?: number;
    question_type?: string;
    difficulty?: number;
    search?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<Question[]>('/questions', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<Question>(`/questions/${id}`).then(r => r.data),

  create: (data: any) =>
    api.post<Question>('/questions', data).then(r => r.data),

  update: (id: number, data: any) =>
    api.put<Question>(`/questions/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/questions/${id}`).then(r => r.data),
};

export const studyProgressApi = {
  list: (params?: {
    student_id?: number;
    course_id?: number;
    risk_level?: string;
    page?: number;
    page_size?: number;
  }) =>
    api.get<StudyProgress[]>('/study-progress', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<StudyProgress>(`/study-progress/${id}`).then(r => r.data),

  submitPractice: (data: {
    question_id: number;
    user_answer?: string;
    is_correct?: boolean;
    score?: number;
    time_spent?: number;
  }) =>
    api.post<PracticeRecord>('/study-progress/practice', data).then(r => r.data),

  listPracticeRecords: (params?: {
    course_id?: number;
    question_id?: number;
    student_id?: number;
    page?: number;
    page_size?: number;
  }) =>
    api.get<PracticeRecord[]>('/study-progress/practice/records', { params }).then(r => r.data),

  getCompletionTrend: (days?: number, course_id?: number) =>
    api.get<CompletionTrendItem[]>('/study-progress/trends/completion', {
      params: { days, course_id }
    }).then(r => r.data),

  assessRisk: (id: number) =>
    api.post(`/study-progress/${id}/assess-risk`).then(r => r.data),

  getChapterProgress: (progressId: number) =>
    api.get(`/study-progress/${progressId}/chapter-progress`).then(r => r.data),

  getChapterRecords: (chapterId: number, studentId?: number) =>
    api.get(`/study-progress/practice/records/by-chapter/${chapterId}`, {
      params: { student_id: studentId }
    }).then(r => r.data),
};

export const reminderApi = {
  listRules: (is_active?: boolean) =>
    api.get<ReminderRule[]>('/reminder-rules', { params: { is_active } }).then(r => r.data),

  createRule: (data: Partial<ReminderRule>) =>
    api.post<ReminderRule>('/reminder-rules', data).then(r => r.data),

  updateRule: (id: number, data: Partial<ReminderRule>) =>
    api.put<ReminderRule>(`/reminder-rules/${id}`, data).then(r => r.data),

  deleteRule: (id: number) =>
    api.delete(`/reminder-rules/${id}`).then(r => r.data),

  getMyReminders: (is_read?: boolean) =>
    api.get<ReminderRecord[]>('/reminder-rules/records/mine', { params: { is_read } }).then(r => r.data),

  markRead: (id: number) =>
    api.post(`/reminder-rules/records/${id}/read`).then(r => r.data),
};

export const processingApi = {
  listCommunications: (progressId: number) =>
    api.get<Communication[]>(`/study-progress/${progressId}/communications`).then(r => r.data),

  createCommunication: (data: { study_progress_id: number; message: string; message_type?: string }) =>
    api.post<Communication>('/communications', data).then(r => r.data),

  listReviews: (progressId: number) =>
    api.get<ReviewConclusion[]>(`/study-progress/${progressId}/reviews`).then(r => r.data),

  createReview: (data: {
    study_progress_id: number;
    conclusion: string;
    action_plan?: string;
    risk_level_after?: string;
  }) =>
    api.post<ReviewConclusion>('/reviews', data).then(r => r.data),

  getMyTodos: (is_completed?: boolean, todo_type?: string) =>
    api.get<TodoItem[]>('/todos/mine', { params: { is_completed, todo_type } }).then(r => r.data),

  createTodo: (data: Partial<TodoItem>) =>
    api.post<TodoItem>('/todos', data).then(r => r.data),

  completeTodo: (id: number) =>
    api.put(`/todos/${id}/complete`).then(r => r.data),

  getTeacherTodos: () =>
    api.get<TodoItem[]>('/todos/teacher').then(r => r.data),
};
