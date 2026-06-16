export type UserRole = 'admin' | 'supervisor' | 'nurse' | 'doctor' | 'family';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type ElderStatus = 'pending' | 'admitted' | 'discharged';

export interface Elder {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: Date;
  idCard: string;
  roomNumber: string;
  admissionDate: Date;
  status: ElderStatus;
  careLevelId: string | null;
  avatar: string | null;
  allergies: string[];
  medicalHistory: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  createdAt: Date;
  updatedAt: Date;
  careLevel?: CareLevel | null;
}

export interface CareLevel {
  id: string;
  name: string;
  scoreRange: { min: number; max: number };
  description: string;
  careItems: string[];
  isActive: boolean;
}

export type AssessmentStatus =
  | 'draft'
  | 'collecting'
  | 'evaluating'
  | 'approving'
  | 'archived'
  | 'closed';

export interface Assessment {
  id: string;
  elderId: string;
  status: AssessmentStatus;
  adlScore: number;
  cognitionScore: number;
  emotionScore: number;
  socialScore: number;
  totalScore: number;
  suggestedLevelId: string | null;
  finalLevelId: string | null;
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;
  elder?: Elder;
  suggestedLevel?: CareLevel | null;
  finalLevel?: CareLevel | null;
}

export interface Medication {
  id: string;
  elderId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate: Date | null;
  prescribedBy: string;
  notes: string;
  isActive: boolean;
}

export interface MedicationExecution {
  id: string;
  medicationId: string;
  executedAt: Date;
  executedBy: string;
  signature: string | null;
  isAbnormal: boolean;
  abnormalNote: string | null;
}

export interface VisitRecord {
  id: string;
  elderId: string;
  visitorName: string;
  relation: string;
  visitorPhone: string;
  visitTime: Date;
  leaveTime: Date | null;
  notes: string;
  recordedBy: string;
}

export type IncidentType = 'fall' | 'other';

export type IncidentStatus = 'reported' | 'supplementing' | 'confirming' | 'closed';

export type PartyRoleType = 'elder' | 'nurse' | 'supervisor' | 'witness' | 'doctor';

export interface Incident {
  id: string;
  elderId: string;
  type: IncidentType;
  status: IncidentStatus;
  reportedAt: Date;
  reportedBy: string;
  location: string;
  description: string;
  closedAt: Date | null;
  summary: string | null;
  correctiveActions: string[];
  elder?: Elder;
  parties?: IncidentParty[];
}

export interface IncidentParty {
  id: string;
  incidentId: string;
  roleType: PartyRoleType;
  userId: string | null;
  personName: string;
  description: string | null;
  supplementAt: Date | null;
  isResponsible: boolean | null;
  responsibilityType: 'direct' | 'indirect' | null;
}

export type EntityType = 'assessment' | 'incident' | 'elder' | 'medication' | 'visit';

export interface FlowAttachment {
  id: string;
  entityType: EntityType;
  entityId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface FlowRemark {
  id: string;
  entityType: EntityType;
  entityId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
}

export interface FlowHandler {
  id: string;
  entityType: 'assessment' | 'incident';
  entityId: string;
  stepName: string;
  userId: string;
  userName: string;
  handledAt: Date | null;
  action: string;
}

export interface DashboardStats {
  totalElders: number;
  admittedElders: number;
  todayAssessments: number;
  activeIncidents: number;
  complianceRate: number;
  careLevelDistribution: { level: string; count: number }[];
}

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ElderFilterInput {
  search?: string;
  gender?: 'male' | 'female';
  status?: ElderStatus;
  careLevelId?: string;
  page?: number;
  pageSize?: number;
}
