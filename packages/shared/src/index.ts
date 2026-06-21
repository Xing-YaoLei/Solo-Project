export enum UserRole {
  ADMIN = 'ADMIN',
  LAWYER = 'LAWYER',
  ASSISTANT = 'ASSISTANT',
  CLIENT = 'CLIENT',
}

export enum CaseStatus {
  MATERIAL_SUBMITTED = 'MATERIAL_SUBMITTED',
  ASSISTANT_REVIEWING = 'ASSISTANT_REVIEWING',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  CONFLICT_CHECKING = 'CONFLICT_CHECKING',
  CONFLICT_PASSED = 'CONFLICT_PASSED',
  CONFLICT_FAILED = 'CONFLICT_FAILED',
  EVIDENCE_REVIEWING = 'EVIDENCE_REVIEWING',
  MATERIAL_INCOMPLETE = 'MATERIAL_INCOMPLETE',
  LAWYER_ASSIGNING = 'LAWYER_ASSIGNING',
  LAWYER_SUPPLEMENTING = 'LAWYER_SUPPLEMENTING',
  CASE_ACTIVE = 'CASE_ACTIVE',
  CASE_CLOSED = 'CASE_CLOSED',
  CASE_ARCHIVED = 'CASE_ARCHIVED',
}

export enum CaseType {
  CIVIL = 'CIVIL',
  CRIMINAL = 'CRIMINAL',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  ARBITRATION = 'ARBITRATION',
  LABOR = 'LABOR',
  INTELLECTUAL_PROPERTY = 'INTELLECTUAL_PROPERTY',
  CONTRACT = 'CONTRACT',
  TORT = 'TORT',
  FAMILY = 'FAMILY',
  REAL_ESTATE = 'REAL_ESTATE',
  CORPORATE = 'CORPORATE',
  OTHER = 'OTHER',
}

export enum FeeType {
  HOURLY = 'HOURLY',
  FIXED = 'FIXED',
  CONTINGENCY = 'CONTINGENCY',
  RETAINER = 'RETAINER',
  MIXED = 'MIXED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  REFUNDED = 'REFUNDED',
}

export enum TimelineEventType {
  CASE_CREATED = 'CASE_CREATED',
  MATERIAL_UPLOADED = 'MATERIAL_UPLOADED',
  IDENTITY_VERIFIED = 'IDENTITY_VERIFIED',
  CONFLICT_CHECK_PASSED = 'CONFLICT_CHECK_PASSED',
  CONFLICT_CHECK_FAILED = 'CONFLICT_CHECK_FAILED',
  EVIDENCE_REVIEWED = 'EVIDENCE_REVIEWED',
  MATERIAL_INCOMPLETE_NOTICE = 'MATERIAL_INCOMPLETE_NOTICE',
  MATERIAL_RESUBMITTED = 'MATERIAL_RESUBMITTED',
  LAWYER_ASSIGNED = 'LAWYER_ASSIGNED',
  CASE_STAGE_SET = 'CASE_STAGE_SET',
  TRIAL_SCHEDULED = 'TRIAL_SCHEDULED',
  FEE_AGREED = 'FEE_AGREED',
  RISK_WARNING = 'RISK_WARNING',
  COMMUNICATION = 'COMMUNICATION',
  VERSION_UPDATE = 'VERSION_UPDATE',
  CASE_CLOSED = 'CASE_CLOSED',
}

export enum MaterialType {
  ID_CARD = 'ID_CARD',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  EVIDENCE_DOC = 'EVIDENCE_DOC',
  CONTRACT = 'CONTRACT',
  COURT_DOCUMENT = 'COURT_DOCUMENT',
  FINANCIAL_RECORD = 'FINANCIAL_RECORD',
  CORRESPONDENCE = 'CORRESPONDENCE',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export enum MaterialStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MISSING = 'MISSING',
  RESUBMITTED = 'RESUBMITTED',
}

export enum CaseStage {
  PRE_TRIAL = 'PRE_TRIAL',
  FILING = 'FILING',
  DISCOVERY = 'DISCOVERY',
  MEDIATION = 'MEDIATION',
  TRIAL = 'TRIAL',
  APPEAL = 'APPEAL',
  ENFORCEMENT = 'ENFORCEMENT',
  SETTLEMENT = 'SETTLEMENT',
}

export interface CaseDelegationDTO {
  title: string;
  caseType: CaseType;
  description: string;
  clientName: string;
  clientIdNumber: string;
  clientPhone: string;
  clientEmail?: string;
  opposingPartyName: string;
  opposingPartyIdNumber?: string;
  materials: MaterialUploadDTO[];
}

export interface MaterialUploadDTO {
  name: string;
  type: MaterialType;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  pageTotal?: number;
  missingPages?: number[];
}

export interface AssistantReviewDTO {
  caseId: string;
  identityVerified: boolean;
  identityNote?: string;
  evidenceChecklistComplete: boolean;
  evidenceNote?: string;
  materialsApproved: string[];
  materialsRejected: string[];
  materialsMissing: MissingMaterialDTO[];
  reviewNote?: string;
}

export interface MissingMaterialDTO {
  materialId?: string;
  materialType: MaterialType;
  description: string;
  missingPages?: number[];
}

export interface LawyerSupplementDTO {
  caseId: string;
  caseStage: CaseStage;
  trialDate?: string;
  trialLocation?: string;
  feeType: FeeType;
  feeAmount: number;
  feeNote?: string;
  riskWarnings: string[];
  supplementNote?: string;
}

export interface ConflictCheckResultDTO {
  caseId: string;
  checkedBy: string;
  hasConflict: boolean;
  conflictDetails?: string;
  conflictingCaseIds?: string[];
  checkedAt: string;
  archivedAt?: string;
}

export interface TimelineEventDTO {
  caseId: string;
  eventType: TimelineEventType;
  title: string;
  content: string;
  operatorId: string;
  operatorName: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface MonthlyReportQueryDTO {
  year: number;
  month: number;
  caseType?: CaseType;
  lawyerId?: string;
  paymentStatus?: PaymentStatus;
}

export interface MonthlyReportDTO {
  year: number;
  month: number;
  totalCases: number;
  activeCases: number;
  closedCases: number;
  totalRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  byCaseType: Record<string, { count: number; revenue: number; collected: number }>;
  byLawyer: Record<string, { count: number; revenue: number; collected: number }>;
  byPaymentStatus: Record<string, { count: number; amount: number }>;
}

export interface CaseListItemDTO {
  id: string;
  title: string;
  caseType: CaseType;
  status: CaseStatus;
  clientName: string;
  lawyerName?: string;
  assistantName?: string;
  createdAt: string;
  updatedAt: string;
  nextTrialDate?: string;
  paymentStatus: PaymentStatus;
  feeAmount?: number;
}

export interface CaseDetailDTO extends CaseListItemDTO {
  description: string;
  clientIdNumber: string;
  clientPhone: string;
  clientEmail?: string;
  opposingPartyName: string;
  opposingPartyIdNumber?: string;
  caseStage?: CaseStage;
  trialLocation?: string;
  feeType?: FeeType;
  feeNote?: string;
  riskWarnings: string[];
  materials: CaseMaterialDTO[];
  timeline: TimelineEventDTO[];
  conflictChecks: ConflictCheckResultDTO[];
}

export interface CaseMaterialDTO {
  id: string;
  name: string;
  type: MaterialType;
  status: MaterialStatus;
  fileUrl: string;
  fileSize: number;
  pageTotal?: number;
  missingPages?: number[];
  version: number;
  uploadedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}
