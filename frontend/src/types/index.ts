export type UserRole = 'admin' | 'trainer' | 'member' | 'manager';

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

export type ProgressStatus = 'on_track' | 'behind' | 'ahead';

export type NotificationStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type AssignmentType = 'exercise' | 'cardio' | 'nutrition' | 'assessment';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface AssignmentTag {
  id: number;
  assignment_id: number;
  tag_id: number;
  tag: Tag;
}

export interface Assignment {
  id: number;
  chapter_id: number;
  title: string;
  description?: string;
  assignment_type: AssignmentType;
  sets?: number;
  reps?: string;
  weight?: number;
  duration_minutes?: number;
  is_completed: boolean;
  completed_at?: string;
  member_note?: string;
  trainer_feedback?: string;
  created_at: string;
  updated_at: string;
  tags: AssignmentTag[];
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  chapter_order: number;
  duration_minutes: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  assignments: Assignment[];
}

export interface CourseMember {
  id: number;
  course_id: number;
  member_id: number;
  joined_at: string;
  expected_progress_rate: number;
  actual_progress_rate: number;
  member: User;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  cover_url?: string;
  trainer_id: number;
  total_sessions: number;
  total_duration_hours: number;
  start_date?: string;
  end_date?: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  trainer: User;
  chapters: Chapter[];
  members: CourseMember[];
}

export interface CourseListItem {
  id: number;
  name: string;
  status: CourseStatus;
  total_sessions: number;
  total_duration_hours: number;
  start_date?: string;
  end_date?: string;
  trainer_name: string;
  member_count: number;
  completion_rate: number;
  created_at: string;
}

export interface ProgressRecord {
  id: number;
  course_id: number;
  member_id: number;
  chapter_id?: number;
  operator_id: number;
  old_progress: number;
  new_progress: number;
  progress_status: ProgressStatus;
  consumed_sessions: number;
  remaining_sessions: number;
  change_reason?: string;
  extra_data: Record<string, any>;
  created_at: string;
  operator: User;
  member: User;
  course: Course;
}

export interface Notification {
  id: number;
  course_id: number;
  from_user_id: number;
  to_user_id: number;
  member_id: number;
  title: string;
  content: string;
  status: NotificationStatus;
  delay_reason?: string;
  action_taken?: string;
  resolved_at?: string;
  closed_at?: string;
  closed_by_id?: number;
  expected_progress: number;
  actual_progress: number;
  gap_hours: number;
  created_at: string;
  updated_at: string;
  course: Course;
  from_user: User;
  to_user: User;
  member: User;
  closed_by?: User;
}

export interface CourseMonthlyStats {
  course_id: number;
  course_name: string;
  trainer_name: string;
  member_name: string;
  total_sessions: number;
  consumed_sessions: number;
  remaining_sessions: number;
  expected_progress: number;
  actual_progress: number;
  completion_rate: number;
  is_behind: boolean;
  gap: number;
}

export interface MonthlyReviewResponse {
  year: number;
  month: number;
  total_courses: number;
  total_members: number;
  overall_completion_rate: number;
  on_track_count: number;
  behind_count: number;
  completed_count: number;
  course_stats: CourseMonthlyStats[];
}

export interface ExportLogResponse {
  id: number;
  export_type: string;
  filter_conditions: Record<string, any>;
  file_name?: string;
  generated_at: string;
  operator_name: string;
}

export interface CurrentProgress {
  course_id: number;
  member_id: number;
  expected_progress: number;
  actual_progress: number;
  last_record?: ProgressRecord;
  is_behind: boolean;
  gap: number;
}
