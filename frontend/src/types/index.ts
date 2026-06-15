export interface FunnelOverview {
  total_enrolled: number;
  pending: number;
  distributed: number;
  received: number;
  returned: number;
  distribution_rate: number;
  completion_rate: number;
  funnel_steps: FunnelStep[];
}

export interface FunnelStep {
  step: string;
  count: number;
  rate: number;
}

export interface ChapterFunnel {
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  total_enrolled: number;
  distributed: number;
  received: number;
  distribution_rate: number;
  completion_rate: number;
}

export interface RegionFunnel {
  region_id: number;
  region_name: string;
  region_code: string;
  total_enrolled: number;
  received: number;
  completion_rate: number;
}

export interface TrendItem {
  date: string;
  total_enrolled: number;
  received: number;
  completion_rate: number;
}

export interface DelayedDistribution {
  id: number;
  distribution_no: string;
  student_name: string;
  textbook_title: string;
  status: string;
  distribute_date: string | null;
  delay_reason: string | null;
  channel: string | null;
}

export interface AlertThreshold {
  id: number;
  name: string;
  type: string;
  threshold_value: number;
  operator: string;
  level: string;
  scope: string;
  is_active: boolean;
  created_at: string;
}

export interface AlertResult {
  threshold_id: number;
  threshold_name: string;
  type: string;
  level: string;
  threshold_value: number;
  actual_value: number;
  operator: string;
  course_id: number | null;
  region_id: number | null;
}

export interface NoteTask {
  id: number;
  task_no: string;
  type: string;
  title: string;
  content: string;
  conclusion: string | null;
  status: string;
  priority: string;
  chart_ref: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface GradeOverview {
  total_students: number;
  avg_score: number;
  excellent_rate: number;
  grade_distribution: Record<string, number>;
}

export interface HomeworkStats {
  total_assignments: number;
  submitted_count: number;
  submit_rate: number;
  late_count: number;
  late_rate: number;
  avg_score: number;
}

export interface ChapterGrade {
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  student_count: number;
  avg_score: number;
}

export interface ReviewMaterial {
  id: number;
  material_no: string;
  title: string;
  type: string;
  period_start: string;
  period_end: string;
  completion_rate: number;
  alert_count: number;
  summary: string;
  status: string;
  created_at: string;
  key_issues?: KeyIssue[];
  improvements?: Improvement[];
  charts_data?: any;
}

export interface KeyIssue {
  type: string;
  severity: string;
  title: string;
  description: string;
  data: any;
}

export interface Improvement {
  issue: string;
  suggestion: string;
  owner: string;
  deadline_days: number;
}

export interface ReminderRule {
  id: number;
  name: string;
  type: string;
  trigger_days: number;
  template: string;
  channel: string;
  is_active: boolean;
}
