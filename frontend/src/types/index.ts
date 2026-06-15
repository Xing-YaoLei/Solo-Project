export type UserRole = 'admin' | 'manager' | 'teacher' | 'student';
export type RiskLevel = 'normal' | 'warning' | 'danger' | 'critical';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Tag {
  id: number;
  name: string;
  category?: string;
  color: string;
  created_at: string;
}

export interface Chapter {
  id: number;
  course_id: number;
  name: string;
  order_index: number;
  description?: string;
  question_count: number;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
  total_questions: number;
  created_at: string;
  chapters?: Chapter[];
  teachers?: User[];
}

export interface Question {
  id: number;
  course_id: number;
  chapter_id?: number;
  question_type: QuestionType;
  content: string;
  options?: Record<string, any>;
  correct_answer?: string;
  explanation?: string;
  difficulty: number;
  is_active: boolean;
  tags: Tag[];
  created_at: string;
  updated_at?: string;
}

export interface StudyProgress {
  id: number;
  student_id: number;
  course_id: number;
  total_questions: number;
  completed_questions: number;
  correct_count: number;
  accuracy_rate: number;
  completion_rate: number;
  risk_level: RiskLevel;
  last_practice_at?: string;
  expected_completion_at?: string;
  created_at: string;
  updated_at?: string;
  student?: User;
  course?: Course;
}

export interface PracticeRecord {
  id: number;
  student_id: number;
  question_id: number;
  course_id?: number;
  chapter_id?: number;
  user_answer?: string;
  is_correct?: boolean;
  score?: number;
  time_spent?: number;
  attempt_number: number;
  created_at: string;
  question?: Question;
}

export interface ReminderRule {
  id: number;
  name: string;
  description?: string;
  rule_type: string;
  threshold: number;
  risk_level: RiskLevel;
  days_without_practice?: number;
  is_active: boolean;
  created_at: string;
}

export interface ReminderRecord {
  id: number;
  study_progress_id: number;
  rule_id?: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface RiskRecord {
  id: number;
  study_progress_id: number;
  previous_level?: RiskLevel;
  current_level: RiskLevel;
  reason?: string;
  created_at: string;
}

export interface Communication {
  id: number;
  study_progress_id: number;
  sender_id: number;
  message: string;
  message_type: string;
  sender?: User;
  created_at: string;
}

export interface ReviewConclusion {
  id: number;
  study_progress_id: number;
  reviewer_id: number;
  conclusion: string;
  action_plan?: string;
  risk_level_after?: RiskLevel;
  reviewer?: User;
  created_at: string;
  updated_at?: string;
}

export interface TodoItem {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  todo_type: string;
  related_id?: number;
  priority: number;
  is_completed: boolean;
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface CompletionTrendItem {
  date: string;
  completion_rate: number;
  student_count: number;
}

export interface ChapterProgressItem {
  chapter_id: number;
  chapter_name: string;
  order_index: number;
  total_questions: number;
  completed_questions: number;
  correct_questions: number;
  completion_rate: number;
  accuracy_rate: number;
  risk_level: RiskLevel;
}

export interface ChapterProgress {
  progress_id: number;
  course_id: number;
  chapters: ChapterProgressItem[];
}
