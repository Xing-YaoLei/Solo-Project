export enum UserRole {
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  MANAGER = 'manager',
  VENDOR = 'vendor',
}

export enum SamplingStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  FOLLOW_UP = 'follow_up',
}

export enum EvidenceStatus {
  COMPLETE = 'complete',
  MISSING = 'missing',
  PARTIAL = 'partial',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RectificationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  CLOSED = 'closed',
}

export enum MaterialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ExceptionType {
  EVIDENCE_MISSING = 'evidence_missing',
  NON_COMPLIANCE = 'non_compliance',
  OTHER = 'other',
}

export enum ExceptionStatus {
  OPEN = 'open',
  PROCESSING = 'processing',
  CLOSED = 'closed',
}

export enum ExportType {
  SAMPLING = 'sampling',
  RECTIFICATION = 'rectification',
  EXCEPTION = 'exception',
  FULL_REPORT = 'full_report',
}
