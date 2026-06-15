export type RoleType = 'Administrator' | 'Teacher' | 'Student' | 'DepartmentHead' | 'AcademicAffairs' | 'Dean';

export type SemesterType = 'Spring' | 'Autumn' | 'Summer';

export type WeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RoomType = 'GeneralClassroom' | 'MultimediaClassroom' | 'Laboratory' | 'ComputerLab' | 'Gymnasium' | 'Auditorium' | 'MeetingRoom';

export type ConflictLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ConflictStatus = 'Pending' | 'UnderReview' | 'Resolved' | 'Escalated' | 'Rejected';

export type ApprovalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'NeedsRevision';

export type CourseStatus = 'Draft' | 'Published' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';

export type ConflictType = 'ClassroomConflict' | 'TeacherConflict' | 'StudentConflict' | 'TimeSlotOverlap' | 'EquipmentShortage' | 'CapacityExceeded';

export interface User {
  id: number;
  userName: string;
  realName: string;
  email: string;
  phone?: string;
  role: RoleType;
  roleName: string;
  departmentId?: number;
  departmentName?: string;
  title?: string;
  avatarUrl?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  headId?: number;
  head?: User;
  isActive: boolean;
  createdAt: string;
}

export interface Semester {
  id: number;
  academicYear: number;
  type: SemesterType;
  startDate: string;
  endDate: string;
  courseSelectionStartDate?: string;
  courseSelectionEndDate?: string;
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  description?: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface TimeSlot {
  id: number;
  name: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Course {
  id: number;
  courseCode: string;
  name: string;
  description?: string;
  credits: number;
  totalHours: number;
  weeklyHours: number;
  maxStudents: number;
  departmentId: number;
  department?: Department;
  semesterId: number;
  semester?: Semester;
  requiredRoomType?: RoomType;
  equipmentRequirements?: string;
  status: CourseStatus;
  prerequisiteCourseId?: number;
  prerequisiteCourse?: Course;
  teacherCourses?: TeacherCourse[];
  schedules?: CourseSchedule[];
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherCourse {
  id: number;
  userId: number;
  teacher?: User;
  courseId: number;
  course?: Course;
  isMainTeacher: boolean;
  teachingRole?: string;
  createdAt: string;
}

export interface Classroom {
  id: number;
  roomNumber: string;
  name: string;
  location?: string;
  type: RoomType;
  capacity: number;
  equipment?: string;
  description?: string;
  floor?: string;
  building?: string;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  hasMicrophone: boolean;
  hasSoundSystem: boolean;
  hasAirConditioning: boolean;
  isDisabledAccessible: boolean;
  schedules?: CourseSchedule[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Student {
  id: number;
  studentNumber: string;
  userId: number;
  user?: User;
  departmentId: number;
  department?: Department;
  major?: string;
  className?: string;
  grade: number;
  gpa: number;
  totalCredits: number;
  enrollmentDate?: string;
  expectedGraduationDate?: string;
  advisor?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CourseSchedule {
  id: number;
  courseId: number;
  course?: Course;
  classroomId: number;
  classroom?: Classroom;
  timeSlotId: number;
  timeSlot?: TimeSlot;
  semesterId: number;
  semester?: Semester;
  dayOfWeek: WeekDay;
  weeks?: string;
  startWeek: number;
  endWeek: number;
  approvalStatus: ApprovalStatus;
  conflicts?: Conflict[];
  approvalRecords?: ApprovalRecord[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface Conflict {
  id: number;
  title: string;
  description?: string;
  type: ConflictType;
  level: ConflictLevel;
  status: ConflictStatus;
  classroomId: number;
  classroom?: Classroom;
  schedule1Id?: number;
  schedule1?: CourseSchedule;
  schedule2Id?: number;
  schedule2?: CourseSchedule;
  teacher1Id?: number;
  teacher1?: User;
  teacher2Id?: number;
  teacher2?: User;
  dayOfWeek?: WeekDay;
  timeSlotId?: number;
  timeSlot?: TimeSlot;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: number;
  resolvedByUser?: User;
  assignedTo?: number;
  assignedToUser?: User;
  communications?: ConflictCommunication[];
  reviews?: ConflictReview[];
  createdAt: string;
  updatedAt?: string;
}

export interface ConflictCommunication {
  id: number;
  conflictId: number;
  conflict?: Conflict;
  userId: number;
  user?: User;
  message: string;
  attachmentUrl?: string;
  type: string;
  createdAt: string;
}

export interface ConflictReview {
  id: number;
  conflictId: number;
  conflict?: Conflict;
  reviewerId: number;
  reviewer?: User;
  reviewOpinion: string;
  result: string;
  suggestions?: string;
  createdAt: string;
}

export interface ApprovalRecord {
  id: number;
  scheduleId: number;
  schedule?: CourseSchedule;
  approverId: number;
  approver?: User;
  status: ApprovalStatus;
  comments?: string;
  approvalLevel: number;
  roleWhenApproved?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface TodoItem {
  id: number;
  type: 'ConflictResolution' | 'ScheduleApproval' | 'ApplicationReview' | 'GradeEntry' | 'Other';
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'InProgress' | 'Completed';
  createdAt: string;
  relatedUrl: string;
  level?: string;
}

export interface ApprovalStatistics {
  totalSchedules: number;
  totalApprovals: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  approvalRate: number;
  averageApprovalHours?: number;
  maxApprovalHours?: number;
  minApprovalHours?: number;
  startDate: string;
  endDate: string;
}

export interface ApprovalTrend {
  date: string;
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  averageApprovalHours?: number;
}

export interface DashboardOverview {
  currentSemester?: string;
  totalCourses: number;
  totalClassrooms: number;
  totalStudents: number;
  totalTeachers: number;
  pendingSchedules: number;
  approvedSchedules: number;
  pendingConflicts: number;
  highRiskConflicts: number;
  approvalRate: number;
  averageApprovalHours?: number;
  totalPendingApprovals: number;
}

export interface ConflictSummary {
  totalConflicts: number;
  byLevel: Record<string, number>;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Transcript {
  id: number;
  studentId: number;
  studentNumber?: string;
  studentName?: string;
  courseId: number;
  courseName?: string;
  semester: string;
  regularScore?: number;
  finalScore?: number;
  finalGrade: number;
  gradePoints: number;
  isPassed: boolean;
  examDate?: string;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt?: string;
}

export type ApplicationType = 'CourseSelection' | 'CourseDrop' | 'CourseChange' | 'MakeUpExam' | 'StudyAbroad' | 'Other';

export interface Application {
  id: number;
  applicationNo: string;
  applicationType: ApplicationType;
  title: string;
  description: string;
  applicantId: number;
  applicantName?: string;
  applicationDate: string;
  relatedCourseId?: number;
  relatedCourseName?: string;
  status: ApprovalStatus;
  approverId?: number;
  approverName?: string;
  approvalComment?: string;
  approvedAt?: string;
  attachments?: string;
  approvalHistory?: ApprovalRecord[];
  createdAt: string;
  updatedAt?: string;
}

export interface TranscriptStats {
  total: number;
  avgGrade: number;
  passRate: number;
  failedCount: number;
}

export interface ApplicationStats {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
}
