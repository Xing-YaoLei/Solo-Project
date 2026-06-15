export interface Tag {
  id: number
  name: string
  color: string
}

export interface Course {
  id: number
  name: string
  description: string
  chapters: Chapter[]
  created_at: string
}

export interface Chapter {
  id: number
  name: string
  order: number
  course: number
  created_at: string
}

export interface Material {
  id: number
  title: string
  description: string
  file_url: string
  course: number | null
  course_name: string | null
  tags: Tag[]
  created_at: string
}

export interface Student {
  id: number
  name: string
  class_name: string
  contact: string
  guardian_contact: string
}

export type DistributionStatus = 'pending' | 'following' | 'reviewing' | 'completed'

export interface Distribution {
  id: number
  material: number
  material_title: string
  student: Student
  status: DistributionStatus
  status_display: string
  distributed_at: string
  risk_level: 'high' | 'medium' | 'low' | null
  risk_level_display: string | null
  tags: Tag[]
}

export interface ChapterCompletion {
  id: number
  progress: number
  chapter: number
  chapter_name: string
  completed: boolean
  completed_at: string | null
}

export interface Grade {
  id: number
  progress: number
  chapter: number
  chapter_name: string
  score: number
  feedback: string
  graded_by: number | null
  graded_at: string
}

export interface Progress {
  id: number
  distribution: number
  percentage: number
  last_updated: string
  chapter_completions: ChapterCompletion[]
  grades: Grade[]
  student_name: string
  material_title: string
}

export interface Communication {
  id: number
  risk: number
  content: string
  comm_type: 'phone' | 'email' | 'in_person' | 'online'
  comm_type_display: string
  created_by: number | null
  created_at: string
}

export interface ReviewConclusion {
  id: number
  risk: number
  conclusion: string
  reviewer_id: number | null
  reviewer_name: string | null
  created_at: string
}

export type RiskLevel = 'high' | 'medium' | 'low'

export interface RiskRecord {
  id: number
  distribution: number | Distribution
  distribution_id: number
  risk_level: RiskLevel
  risk_level_display: string
  reason: string
  communications: Communication[]
  review_conclusions: ReviewConclusion[]
  created_at: string
  updated_at: string
}

export interface RiskRecordList {
  id: number
  distribution: number
  risk_level: RiskLevel
  risk_level_display: string
  reason: string
  student_name: string
  material_title: string
  created_at: string
  updated_at: string
}

export interface ReminderRule {
  id: number
  name: string
  condition_type: 'progress_below' | 'no_update_days' | 'grade_below'
  condition_type_display: string
  threshold: number
  remind_method: 'in_app' | 'email' | 'both'
  remind_method_display: string
  frequency_days: number
  is_active: boolean
}

export interface ReminderLog {
  id: number
  rule: number
  rule_name: string
  student: number
  student_name: string
  message: string
  sent_at: string
  is_read: boolean
}

export interface StatusCount {
  pending: number
  following: number
  reviewing: number
  completed: number
}

export interface AnalyticsOverview {
  total_students: number
  completion_rate: number
  risk_count: number
  pending_count: number
}

export interface CompletionTrend {
  labels: string[]
  planned: number[]
  actual: number[]
}

export interface RiskDistributionData {
  high: number
  medium: number
  low: number
  by_course: Record<string, { high: number; medium: number; low: number }>
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
