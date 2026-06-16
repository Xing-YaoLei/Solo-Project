export type UserRole = 'doctor' | 'nurse' | 'receptionist' | 'admin';

export type PatientStatus = 'active' | 'inactive' | 'archived';

export type RecordStatus = 'draft' | 'reviewing' | 'confirmed' | 'archived';

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export type FollowupStatus = 'pending' | 'completed' | 'missed' | 'cancelled';

export type FollowupType = 'phone' | 'visit' | 'imaging' | 'consultation';

export type ImagingType = 'xray' | 'cbct' | 'intraoral' | 'panoramic' | 'other';

export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExceptionStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export type ResponsibilityType = 'patient' | 'clinic' | 'doctor' | 'system' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Patient {
  id: string;
  patientNo: string;
  name: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  idCard?: string;
  address?: string;
  status: PatientStatus;
  remarks?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentSummary?: string;
  status: RecordStatus;
  doctorId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  recordId?: string;
  title: string;
  description?: string;
  status: TreatmentStatus;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowupTask {
  id: string;
  patientId: string;
  treatmentPlanId?: string;
  type: FollowupType;
  scheduledDate: Date;
  actualDate?: Date;
  status: FollowupStatus;
  notes?: string;
  result?: string;
  assigneeId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImagingAttachment {
  id: string;
  patientId: string;
  recordId?: string;
  treatmentPlanId?: string;
  type: ImagingType;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  uploadedBy?: string;
  uploadedAt: Date;
}

export interface ExceptionOrder {
  id: string;
  patientId: string;
  followupTaskId?: string;
  title: string;
  description?: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  impactScope?: string;
  responsibility?: ResponsibilityType;
  responsiblePerson?: string;
  handlingResult?: string;
  closedAt?: Date;
  reportedBy?: string;
  handledBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
