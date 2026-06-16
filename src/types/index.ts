export interface User {
  id: string;
  username: string;
  role: 'auditor' | 'pharmacist' | 'manager' | 'admin';
  store_id?: string;
  region_id?: string;
  store_name?: string;
  region_name?: string;
}

export interface BatchInfo {
  drug_name: string;
  batch_no: string;
  expiry_date: string;
  quantity: number;
}

export interface MemberProfile {
  patient_id: string;
  name: string;
  gender: string;
  age: number;
  allergies: string[];
  medication_history: string[];
}

export interface Replenishment {
  order_no: string;
  status: 'pending' | 'shipped' | 'delivered';
  expected_arrival?: string;
}

export interface InsuranceRecord {
  settlement_no: string;
  amount: number;
  match_status: 'matched' | 'unmatched' | 'partial';
}

export interface PrescriptionPhoto {
  id: string;
  url: string;
  uploaded_at: string;
}

export interface TimelineEvent {
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
  status: string;
}

export interface Prescription {
  id: string;
  prescription_no: string;
  store_id: string;
  store_name: string;
  patient_id: string;
  patient_name: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'exception';
  prescription_type: 'normal' | 'chronic' | 'pediatric';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  batch_info: BatchInfo[];
  member_profile: MemberProfile;
  replenishment?: Replenishment;
  insurance_record?: InsuranceRecord;
  photos: PrescriptionPhoto[];
  timeline: TimelineEvent[];
}

export interface ExceptionRecord {
  id: string;
  exception_no: string;
  prescription_id: string;
  prescription_no: string;
  reason: string;
  impact_scope: string;
  assignee_id: string;
  assignee_name: string;
  status: 'open' | 'processing' | 'resolved' | 'closed';
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

export interface ExportRequest {
  dimensions: string[];
  date_range: { start: string; end: string };
  include_caliber: boolean;
  format: string;
}

export interface CaliberNote {
  id: string;
  metric: string;
  definition: string;
  exclusions: string[];
  remarks: string;
}

export interface DashboardStats {
  total_prescriptions: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  exception_count: number;
  avg_review_hours: number;
  approval_rate: number;
}

export interface StoreProgress {
  store_id: string;
  store_name: string;
  pending: number;
  approved: number;
  rejected: number;
  exception: number;
}
