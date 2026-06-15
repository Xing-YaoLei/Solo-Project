export interface Certificate {
  id: number;
  name: string;
  description?: string;
  code?: string;
  examDate?: string;
  registrationStart?: string;
  registrationEnd?: string;
  isActive: boolean;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  certificateId: number;
  certificateName?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  content?: string;
  courseId: number;
  parentChapterId?: number;
  sortOrder: number;
  estimatedHours: number;
  isActive: boolean;
  childChapters?: Chapter[];
  questionTags?: QuestionTag[];
}

export interface QuestionTag {
  id: number;
  name: string;
  description?: string;
  chapterId?: number;
  assignmentId?: number;
  questionCount: number;
  difficulty: number;
  difficultyText?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  courseId: number;
  chapterId?: number;
  chapterTitle?: string;
  type: number;
  typeText?: string;
  dueDate?: string;
  totalQuestions: number;
  sortOrder: number;
  isActive: boolean;
  questionTags?: QuestionTag[];
}

export interface AssignmentRecord {
  id: number;
  assignmentId: number;
  assignmentTitle?: string;
  assignmentType: number;
  assignmentTypeText?: string;
  userId: number;
  userName?: string;
  correctCount: number;
  totalQuestions: number;
  score: number;
  startedAt?: string;
  submittedAt?: string;
  status: number;
  statusText?: string;
  remark?: string;
}

export interface LearningProgress {
  id: number;
  userId: number;
  userName?: string;
  certificateId: number;
  certificateName?: string;
  courseId?: number;
  courseName?: string;
  completionRate: number;
  targetRate: number;
  startDate?: string;
  targetDate?: string;
  status: number;
  statusText?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProgressHistory {
  id: number;
  learningProgressId: number;
  oldCompletionRate: number;
  newCompletionRate: number;
  oldStatus: number;
  oldStatusText?: string;
  newStatus: number;
  newStatusText?: string;
  oldNote?: string;
  newNote?: string;
  changedByUserId: number;
  changedByName?: string;
  changeReason?: string;
  changedAt: string;
}

export interface LearningProgressDetail {
  progress: LearningProgress;
  chapters: Chapter[];
  assignmentRecords: AssignmentRecord[];
  questionTags: QuestionTag[];
  history: ProgressHistory[];
}

export interface ProgressAlert {
  id: number;
  learningProgressId: number;
  userId: number;
  userName?: string;
  certificateName?: string;
  courseName?: string;
  alertType: number;
  alertTypeText?: string;
  severity: number;
  severityText?: string;
  currentRate: number;
  expectedRate: number;
  behindRate: number;
  message?: string;
  status: number;
  statusText?: string;
  reason?: string;
  actionTaken?: string;
  resolvedAt?: string;
  resolvedByUserId?: number;
  resolvedByName?: string;
  createdAt: string;
  closedAt?: string;
}

export interface MonthlyReview {
  year: number;
  month: number;
  certificateId: number;
  certificateName?: string;
  courseReviews: CourseReview[];
  overallCompletionRate: number;
  totalStudents: number;
  studentsOnTrack: number;
  studentsBehind: number;
  studentsCompleted: number;
  totalAssignments: number;
  completedAssignments: number;
  assignmentCompletionRate: number;
}

export interface CourseReview {
  courseId: number;
  courseName?: string;
  averageCompletionRate: number;
  totalStudents: number;
  studentsOnTrack: number;
  studentsBehind: number;
  assignmentCount: number;
  completedAssignmentCount: number;
  averageScore: number;
}

export interface ExportRecord {
  id: number;
  fileName: string;
  exportType: number;
  exportTypeText?: string;
  filterCriteria?: string;
  startDate?: string;
  endDate?: string;
  totalRecords: number;
  generatedByUserId: number;
  generatedByName?: string;
  generatedAt: string;
  expiresAt?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export enum ProgressStatus {
  NotStarted = 0,
  InProgress = 1,
  OnTrack = 2,
  Behind = 3,
  Completed = 4,
  Paused = 5,
}

export enum AlertStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3,
  Ignored = 4,
}

export enum AlertSeverity {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum AlertType {
  ProgressBehind = 1,
  DeadlineApproaching = 2,
  NoActivity = 3,
  ScoreDrop = 4,
}

export enum ExportType {
  LearningProgress = 1,
  MonthlyReview = 2,
  AssignmentRecords = 3,
  Alerts = 4,
}

export enum RecordStatus {
  NotStarted = 0,
  InProgress = 1,
  Submitted = 2,
  Reviewed = 3,
}
